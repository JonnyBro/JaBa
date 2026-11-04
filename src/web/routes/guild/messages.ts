import { buildContainer, parseBlocks, parseColor } from "@/helpers/message-blocks.js";
import { MessageFlags, PermissionsBitField } from "discord.js";
import { FastifyInstance } from "fastify";
import { logAction } from "../../audit.js";
import { getSendableChannel } from "../../channels.js";
import { fail, send } from "../../utils.js";

export default async function messagesRoutes(fastify: FastifyInstance) {
	fastify.post("/messages", async (req, reply) => {
		const body = (req.body ?? {}) as { channelId?: unknown; blocks?: unknown; color?: unknown; mentions?: unknown };

		const blocks = parseBlocks(body.blocks);
		if (typeof blocks === "string") return fail(reply, 400, blocks);

		const channel = getSendableChannel(req.guild, body.channelId);
		if (!channel) return fail(reply, 400, "The bot can't send messages in this channel");

		// @everyone only works for those who could ping it themselves
		const actor = await req.guild.members.fetch(req.session.user!.id).catch(() => null);
		const canPingEveryone = !!actor?.permissionsIn(channel.id).has(PermissionsBitField.Flags.MentionEveryone);

		const message = await channel.send({
			flags: MessageFlags.IsComponentsV2,
			components: [buildContainer(blocks, parseColor(body.color))],
			allowedMentions: {
				parse:
					body.mentions === true ? ["users", "roles", ...(canPingEveryone ? ["everyone" as const] : [])] : [],
			},
		});

		await logAction(req, req.guild.id, {
			action: "message.send",
			details: { channelId: channel.id, messageUrl: message.url, blocks: blocks.length },
		});

		return send(reply, { url: message.url });
	});
}
