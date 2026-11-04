import {
	createGiveaway,
	endGiveaway,
	GiveawayError,
	MAX_PRIZE,
	MAX_WINNERS,
	rerollGiveaway,
	validateGiveaway,
} from "@/helpers/giveaways.js";
import logger from "@/helpers/logger.js";
import { getShopItems, itemLabel } from "@/helpers/shop.js";
import GiveawayModel, { IGiveawaySchema } from "@/models/GiveawayModel.js";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { Types } from "mongoose";
import { logAction } from "../../audit.js";
import { getSendableChannel } from "../../channels.js";
import { fail, send } from "../../utils.js";

const LIST_LIMIT = 50;
const MINUTE = 60 * 1000;

const ERRORS: Record<GiveawayError, string> = {
	BAD_PRIZE: `The prize must be 1-${MAX_PRIZE} characters long`,
	BAD_DURATION: "The duration must be from 1 minute to 30 days",
	BAD_WINNERS: `There can be 1 to ${MAX_WINNERS} winners`,
	BAD_CREDITS: "Credits must be a whole number from 0",
	NO_ITEM: "That shop item doesn't exist",
	NO_ROLE: "That role doesn't exist",
};

const serialize = (giveaway: IGiveawaySchema, guildId: string) => ({
	id: giveaway._id.toString(),
	prize: giveaway.prize,
	channelId: giveaway.channelId,
	url: giveaway.messageId
		? `https://discord.com/channels/${guildId}/${giveaway.channelId}/${giveaway.messageId}`
		: null,
	hostId: giveaway.hostId,
	winners: giveaway.winners,
	credits: giveaway.credits,
	itemId: giveaway.itemId?.toString() ?? null,
	requiredLevel: giveaway.requiredLevel,
	requiredRoleId: giveaway.requiredRoleId,
	participants: giveaway.participants.length,
	winnerIds: giveaway.winnerIds,
	endsAt: giveaway.endsAt.getTime(),
	ended: giveaway.ended,
});

const getGiveaway = async (req: FastifyRequest, reply: FastifyReply) => {
	const { giveawayId } = req.params as { giveawayId: string };
	const giveaway = Types.ObjectId.isValid(giveawayId)
		? await GiveawayModel.findOne({ _id: giveawayId, guildId: req.guild.id }).lean()
		: null;
	if (!giveaway) fail(reply, 404, "Giveaway not found");

	return giveaway;
};

export default async function giveawaysRoutes(fastify: FastifyInstance) {
	fastify.get("/giveaways", async (req, reply) => {
		const [giveaways, items] = await Promise.all([
			GiveawayModel.find({ guildId: req.guild.id }).sort({ createdAt: -1 }).limit(LIST_LIMIT).lean(),
			getShopItems(req.guild.id),
		]);

		const roles = req.guild.roles.cache
			.filter(role => role.id !== req.guild.id && !role.managed)
			.sort((a, b) => b.position - a.position)
			.map(role => ({ id: role.id, name: role.name, color: role.hexColor }));

		return send(reply, {
			giveaways: giveaways.map(g => serialize(g, req.guild.id)),
			items: items.map(item => ({ id: item._id.toString(), name: itemLabel(item) })),
			roles,
		});
	});

	fastify.post("/giveaways", async (req, reply) => {
		const guild = req.guild;
		const body = (req.body ?? {}) as Record<string, unknown>;

		const channel = getSendableChannel(guild, body.channelId);
		if (!channel) return fail(reply, 400, "Pick a channel the bot can send messages to");

		const input = {
			prize: typeof body.prize === "string" ? body.prize : "",
			duration: Number(body.minutes) * MINUTE,
			winners: Number(body.winners ?? 1),
			credits: Number(body.credits ?? 0),
			itemId: typeof body.itemId === "string" && body.itemId ? body.itemId : null,
			requiredLevel: Math.max(Number(body.requiredLevel) || 0, 0),
			requiredRoleId: typeof body.requiredRoleId === "string" && body.requiredRoleId ? body.requiredRoleId : null,
		};

		const error = await validateGiveaway(guild, input);
		if (error) return fail(reply, 400, ERRORS[error]);

		const created = await createGiveaway(guild, { ...input, channel, hostId: req.session.user!.id }).catch(
			error => {
				logger.warn(`[Giveaways] Can't post a giveaway in ${guild.id}:`, error.message);
				return null;
			},
		);
		if (!created) return fail(reply, 400, "Couldn't post the giveaway in that channel");

		await logAction(req, guild.id, {
			action: "giveaway.create",
			target: { id: created.giveaway._id.toString(), name: created.giveaway.prize },
			details: { messageUrl: created.url },
		});

		return send(reply, serialize(created.giveaway, guild.id), 201);
	});

	fastify.post("/giveaways/:giveawayId/end", async (req, reply) => {
		const giveaway = await getGiveaway(req, reply);
		if (!giveaway) return;

		if (!(await endGiveaway(giveaway._id.toString()))) return fail(reply, 400, "This giveaway has already ended");

		await logAction(req, req.guild.id, {
			action: "giveaway.end",
			target: { id: giveaway._id.toString(), name: giveaway.prize },
		});

		return send(reply, { ok: true });
	});

	fastify.post("/giveaways/:giveawayId/reroll", async (req, reply) => {
		const giveaway = await getGiveaway(req, reply);
		if (!giveaway) return;

		const result = await rerollGiveaway(giveaway._id.toString());
		if (result === "NOT_ENDED") return fail(reply, 400, "End the giveaway first");
		if (result === "NO_ONE_LEFT") return fail(reply, 400, "Everyone who joined has already won");

		await logAction(req, req.guild.id, {
			action: "giveaway.reroll",
			target: { id: giveaway._id.toString(), name: giveaway.prize },
			details: { winner: result.user.username },
		});

		return send(reply, { winner: result.displayName });
	});

	fastify.delete("/giveaways/:giveawayId", async (req, reply) => {
		const giveaway = await getGiveaway(req, reply);
		if (!giveaway) return;

		await GiveawayModel.deleteOne({ _id: giveaway._id });

		const channel = req.guild.channels.cache.get(giveaway.channelId);
		if (giveaway.messageId && channel?.isTextBased())
			await channel.messages.delete(giveaway.messageId).catch(() => {});

		await logAction(req, req.guild.id, {
			action: "giveaway.delete",
			target: { id: giveaway._id.toString(), name: giveaway.prize },
		});

		return send(reply, { ok: true });
	});
}
