import { buildTicketPanel, getTicketSettings } from "@/helpers/tickets.js";
import { TicketSettings } from "@/models/GuildModel.js";
import useClient from "@/utils/use-client.js";
import { PermissionsBitField } from "discord.js";
import { FastifyInstance } from "fastify";
import { logAction } from "../../audit.js";
import { getSendableChannel } from "../../channels.js";
import { fail, send } from "../../utils.js";

const MAX_TEXT = 4000;
const MAX_LABEL = 80;
const MAX_SUPPORT_ROLES = 5;

const serialize = (settings: TicketSettings) => ({
	supportRoles: [...settings.supportRoles],
	logChannel: settings.logChannel,
	transcriptDm: settings.transcriptDm,
});

export default async function ticketsRoutes(fastify: FastifyInstance) {
	fastify.get("/tickets", async (req, reply) => {
		const guild = req.guild;
		const roles = guild.roles.cache
			.filter(role => role.id !== guild.id && !role.managed)
			.sort((a, b) => b.position - a.position)
			.map(role => ({ id: role.id, name: role.name, color: role.hexColor }));

		return send(reply, { settings: serialize(await getTicketSettings(guild.id)), roles });
	});

	fastify.put("/tickets/settings", async (req, reply) => {
		const guild = req.guild;
		const body = (req.body ?? {}) as Record<string, unknown>;

		const input = Array.isArray(body.supportRoles) ? body.supportRoles : [];
		const supportRoles = [
			...new Set(
				input.filter(
					(id): id is string => typeof id === "string" && id !== guild.id && guild.roles.cache.has(id),
				),
			),
		];
		if (supportRoles.length > MAX_SUPPORT_ROLES)
			return fail(reply, 400, `There can be up to ${MAX_SUPPORT_ROLES} support roles`);

		let logChannel: string | null = null;
		if (body.logChannel) {
			const channel = getSendableChannel(guild, body.logChannel, [PermissionsBitField.Flags.AttachFiles]);
			if (!channel) return fail(reply, 400, "The bot can't send files in the log channel");

			logChannel = channel.id;
		}

		const guildData = await useClient().getGuildData(guild.id);
		const before = serialize(guildData.plugins.tickets);

		guildData.set("plugins.tickets", { supportRoles, logChannel, transcriptDm: body.transcriptDm === true });
		await guildData.save();

		const after = serialize(guildData.plugins.tickets);
		await logAction(req, guild.id, { action: "tickets.settings", details: { before, after } });

		return send(reply, after);
	});

	fastify.post("/tickets/panel", async (req, reply) => {
		const body = (req.body ?? {}) as { channelId?: unknown; text?: unknown; label?: unknown; emoji?: unknown };
		const text = typeof body.text === "string" ? body.text.trim() : "";
		const label = typeof body.label === "string" ? body.label.trim() : "";
		const emoji = typeof body.emoji === "string" ? body.emoji.trim() : null;

		if (!text || text.length > MAX_TEXT) return fail(reply, 400, `Text must be 1-${MAX_TEXT} characters`);
		if (!label || label.length > MAX_LABEL) return fail(reply, 400, `Label must be 1-${MAX_LABEL} characters`);

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
