import { buildGreeting, GreetingKind } from "@/helpers/greetings.js";
import { parseBlocks } from "@/helpers/message-blocks.js";
import { GreetingMessage, GreetingSettings } from "@/models/GuildModel.js";
import useClient from "@/utils/use-client.js";
import { Guild } from "discord.js";
import { FastifyInstance } from "fastify";
import { logAction } from "../../audit.js";
import { getSendableChannel } from "../../channels.js";
import { getAssignableRoles } from "../../roles.js";
import { fail, send } from "../../utils.js";

const KINDS: GreetingKind[] = ["welcome", "goodbye", "dm"];
const MAX_AUTOROLES = 10;

const serializeMessage = (message: GreetingMessage) => ({
	enabled: message.enabled,
	channel: message.channel,
	blocks: message.blocks,
	color: message.color,
	avatar: message.avatar,
});

const serialize = (greetings: GreetingSettings) => ({
	welcome: serializeMessage(greetings.welcome),
	goodbye: serializeMessage(greetings.goodbye),
	dm: serializeMessage(greetings.dm),
	autoroles: [...greetings.autoroles],
});

const parseMessage = (guild: Guild, kind: GreetingKind, raw: unknown): GreetingMessage | string => {
	const body = (raw ?? {}) as Record<string, unknown>;
	const enabled = body.enabled === true;

	const blocks = Array.isArray(body.blocks) && !body.blocks.length ? [] : parseBlocks(body.blocks);
	if (typeof blocks === "string") return `${kind}: ${blocks}`;
	if (enabled && !blocks.length) return `${kind}: add at least one block`;

	let channel: string | null = null;
	if (kind !== "dm" && (enabled || body.channel)) {
		const found = getSendableChannel(guild, body.channel);
		if (!found) return `${kind}: pick a channel the bot can send messages to`;

		channel = found.id;
	}

	const color = typeof body.color === "string" && /^#[0-9a-f]{6}$/i.test(body.color) ? body.color : null;

	return { enabled, channel, blocks, color, avatar: body.avatar !== false };
};

export default async function greetingsRoutes(fastify: FastifyInstance) {
	fastify.get("/greetings", async (req, reply) => {
		const guildData = await useClient().getGuildData(req.guild.id);

		return send(reply, { ...serialize(guildData.plugins.greetings), roles: getAssignableRoles(req.guild) });
	});

	fastify.put("/greetings", async (req, reply) => {
		const guild = req.guild;
		const body = (req.body ?? {}) as Record<string, unknown>;

		const messages: Partial<Record<GreetingKind, GreetingMessage>> = {};
		for (const kind of KINDS) {
			const message = parseMessage(guild, kind, body[kind]);
			if (typeof message === "string") return fail(reply, 400, message);

			messages[kind] = message;
		}

		const input = Array.isArray(body.autoroles) ? [...new Set(body.autoroles)] : [];
		if (input.length > MAX_AUTOROLES) return fail(reply, 400, `There can be up to ${MAX_AUTOROLES} autoroles`);

		const assignable = new Set(getAssignableRoles(guild).map(role => role.id));
		if (!input.every((id): id is string => typeof id === "string" && assignable.has(id)))
			return fail(reply, 400, "The bot can't give one of the autoroles");

		const guildData = await useClient().getGuildData(guild.id);
		const before = serialize(guildData.plugins.greetings);

		guildData.set("plugins.greetings", { ...messages, autoroles: input });
		await guildData.save();

		const after = serialize(guildData.plugins.greetings);
		const summary = (s: ReturnType<typeof serialize>) => ({
			welcome: s.welcome.enabled,
			goodbye: s.goodbye.enabled,
			dm: s.dm.enabled,
			autoroles: s.autoroles.length,
		});

		await logAction(req, guild.id, {
			action: "greetings.update",
			details: { before: summary(before), after: summary(after) },
		});

		return send(reply, after);
	});

	// Sends the unsaved message as if whoever clicks the button had just joined
	fastify.post("/greetings/test", async (req, reply) => {
		const guild = req.guild;
		const body = (req.body ?? {}) as { kind?: unknown; message?: unknown };

		const kind = KINDS.find(k => k === body.kind);
		if (!kind) return fail(reply, 400, "Unknown greeting");

		const message = parseMessage(guild, kind, { ...(body.message as object), enabled: true });
		if (typeof message === "string") return fail(reply, 400, message);

		const member = await guild.members.fetch(req.session.user!.id).catch(() => null);
		if (!member) return fail(reply, 400, "You need to be on the server to test it");

		const payload = buildGreeting(member, message, kind);

		try {
			if (kind === "dm") await member.send(payload);
			else await getSendableChannel(guild, message.channel)!.send(payload);
		} catch {
			return fail(
				reply,
				400,
				kind === "dm" ? "Couldn't DM you, check your privacy settings" : "Couldn't send it",
			);
		}

		return send(reply, { ok: true });
	});
}
