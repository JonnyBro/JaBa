import MemberModel from "@/models/MemberModel.js";
import UserModel from "@/models/UserModel.js";
import useClient from "@/utils/use-client.js";
import { FastifyInstance } from "fastify";
import { fail, requireUser, send } from "../utils.js";

const MAX_BIO = 500;
const MAX_REMIND_MESSAGE = 1000;
const MAX_REMINDS = 25;
const MAX_REMIND_AHEAD_MS = 5 * 365 * 24 * 60 * 60 * 1000;
// Same limit as the /birthdate command, about 80 years
const MAX_AGE_MS = 2.523e12;

const parseBirthdate = (value: unknown) => {
	const { day, month, year } = (value ?? {}) as { day?: unknown; month?: unknown; year?: unknown };
	const [d, m, y] = [Number(day), Number(month), Number(year)];
	if (![d, m, y].every(Number.isInteger)) return null;

	const date = new Date(y, m - 1, d);
	// Noon is the same day in every timezone
	date.setHours(13);

	if (date.getDate() !== d || date.getMonth() !== m - 1 || date.getFullYear() !== y) return null;
	if (date.getTime() > Date.now() || date.getTime() < Date.now() - MAX_AGE_MS) return null;

	return date.getTime();
};

export default async function profileRoutes(fastify: FastifyInstance) {
	fastify.addHook("preHandler", requireUser);

	fastify.get("/api/users/me/profile", async (req, reply) => {
		const client = useClient();
		const userId = req.session.user!.id;
		const [userData, members] = await Promise.all([
			client.getUserData(userId),
			MemberModel.find({ id: userId }).lean(),
		]);

		const servers = members
			.map(m => ({ data: m, guild: client.guilds.cache.get(m.guildID) }))
			.filter(({ guild }) => guild)
			.map(({ data, guild }) => ({
				id: guild!.id,
				name: guild!.name,
				icon: guild!.iconURL({ size: 64 }),
				money: data.money ?? 0,
				bank: data.bank ?? 0,
				level: data.level ?? 0,
				exp: data.exp ?? 0,
			}))
			.sort((a, b) => b.money + b.bank - (a.money + a.bank));

		return send(reply, {
			rep: userData.rep,
			bio: userData.bio,
			birthdate: userData.birthdate,
			registeredAt: userData.registeredAt,
			reminds: [...userData.reminds].sort((a, b) => a.sendAt - b.sendAt),
			servers,
		});
	});

	fastify.patch("/api/users/me/profile", async (req, reply) => {
		const body = (req.body ?? {}) as { bio?: unknown; birthdate?: unknown };
		const userData = await useClient().getUserData(req.session.user!.id);

		if (body.bio !== undefined) {
			if (body.bio !== null && (typeof body.bio !== "string" || body.bio.length > MAX_BIO))
				return fail(reply, 400, `The bio must be up to ${MAX_BIO} characters`);

			userData.set("bio", typeof body.bio === "string" && body.bio.trim() ? body.bio.trim() : null);
		}

		if (body.birthdate !== undefined) {
			const birthdate = body.birthdate === null ? null : parseBirthdate(body.birthdate);
			if (body.birthdate !== null && birthdate === null) return fail(reply, 400, "Invalid birthdate");

			userData.set("birthdate", birthdate);
		}

		await userData.save();

		return send(reply, { bio: userData.bio, birthdate: userData.birthdate });
	});

	fastify.post("/api/users/me/reminds", async (req, reply) => {
		const body = (req.body ?? {}) as { message?: unknown; sendAt?: unknown };
		const message = typeof body.message === "string" ? body.message.trim() : "";
		const sendAt = Number(body.sendAt);

		if (!message || message.length > MAX_REMIND_MESSAGE)
			return fail(reply, 400, `The message must be 1-${MAX_REMIND_MESSAGE} characters`);
		if (!Number.isFinite(sendAt) || sendAt <= Date.now() || sendAt > Date.now() + MAX_REMIND_AHEAD_MS)
			return fail(reply, 400, "Pick a time in the future");

		const userData = await useClient().getUserData(req.session.user!.id);
		if (userData.reminds.length >= MAX_REMINDS)
			return fail(reply, 400, `You can have up to ${MAX_REMINDS} reminders`);

		// Reminders are stored in seconds, like the /remindme command does
		const remind = { message, createdAt: Math.floor(Date.now() / 1000), sendAt: Math.floor(sendAt / 1000) };

		await UserModel.updateOne({ id: userData.id }, { $push: { reminds: remind } });

		return send(reply, remind);
	});

	fastify.delete("/api/users/me/reminds", async (req, reply) => {
		const { createdAt, sendAt } = req.query as { createdAt?: string; sendAt?: string };

		// Reminders have no id, the pair of timestamps tells them apart
		const result = await UserModel.updateOne(
			{ id: req.session.user!.id },
			{ $pull: { reminds: { createdAt: Number(createdAt), sendAt: Number(sendAt) } } },
		);

		if (!result.modifiedCount) return fail(reply, 404, "Reminder not found");

		return send(reply, { ok: true });
	});
}
