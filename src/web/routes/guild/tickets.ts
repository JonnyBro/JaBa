import { buildTicketPanel } from "@/helpers/tickets.js";
import { PermissionsBitField } from "discord.js";
import { FastifyInstance } from "fastify";
import { logAction } from "../../audit.js";
import { getSendableChannel } from "../../channels.js";
import { fail, send } from "../../utils.js";

const MAX_TEXT = 4000;
const MAX_LABEL = 80;

export default async function ticketsRoutes(fastify: FastifyInstance) {
	fastify.post("/tickets/panel", async (req, reply) => {
		const body = (req.body ?? {}) as { channelId?: unknown; text?: unknown; label?: unknown; emoji?: unknown };
		const text = typeof body.text === "string" ? body.text.trim() : "";
		const label = typeof body.label === "string" ? body.label.trim() : "";
		const emoji = typeof body.emoji === "string" ? body.emoji.trim() : null;

		if (!text || text.length > MAX_TEXT) return fail(reply, 400, `Text must be 1-${MAX_TEXT} characters`);
		if (!label || label.length > MAX_LABEL) return fail(reply, 400, `Label must be 1-${MAX_LABEL} characters`);

		// Tickets are private threads in the same channel
		const channel = getSendableChannel(req.guild, body.channelId, [
			PermissionsBitField.Flags.CreatePrivateThreads,
			PermissionsBitField.Flags.SendMessagesInThreads,
		]);
		if (!channel) return fail(reply, 400, "The bot can't send messages or create threads in this channel");

		const message = await channel.send(buildTicketPanel(text, label, emoji));

		await logAction(req, req.guild.id, {
			action: "tickets.panel",
			details: { channelId: channel.id, messageUrl: message.url },
		});

		return send(reply, { url: message.url });
	});
}
