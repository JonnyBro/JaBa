import { MODLOG_EVENTS, ModLogEvent, ModLogSettings } from "@/models/GuildModel.js";
import useClient from "@/utils/use-client.js";
import { PermissionsBitField } from "discord.js";
import { FastifyInstance } from "fastify";
import { logAction } from "../../audit.js";
import { getSendableChannel } from "../../channels.js";
import { fail, send } from "../../utils.js";

const MAX_IGNORED = 25;

const pickEvents = (source: Partial<Record<string, unknown>>) =>
	Object.fromEntries(MODLOG_EVENTS.map(event => [event, source[event] === true])) as Record<ModLogEvent, boolean>;

const serialize = (settings: ModLogSettings) => ({
	channel: settings.channel,
	events: pickEvents(settings.events),
	ignoredChannels: [...settings.ignoredChannels],
});

export default async function modlogRoutes(fastify: FastifyInstance) {
	fastify.get("/modlog", async (req, reply) => {
		const guildData = await useClient().getGuildData(req.guild.id);

		return send(reply, {
			settings: serialize(guildData.plugins.modlog),
			canViewAuditLog: !!req.guild.members.me?.permissions.has(PermissionsBitField.Flags.ViewAuditLog),
		});
	});

	fastify.put("/modlog", async (req, reply) => {
		const guild = req.guild;
		const body = (req.body ?? {}) as Record<string, unknown>;

		let channel: string | null = null;
		if (body.channel) {
			const sendable = getSendableChannel(guild, body.channel);
			if (!sendable) return fail(reply, 400, "The bot can't send messages in the log channel");

			channel = sendable.id;
		}

		const events = pickEvents((body.events ?? {}) as Record<string, unknown>);

		const ignored = Array.isArray(body.ignoredChannels) ? body.ignoredChannels : [];
		const ignoredChannels = [
			...new Set(ignored.filter((id): id is string => typeof id === "string" && guild.channels.cache.has(id))),
		];
		if (ignoredChannels.length > MAX_IGNORED)
			return fail(reply, 400, `There can be up to ${MAX_IGNORED} ignored channels`);

		const guildData = await useClient().getGuildData(guild.id);
		const before = serialize(guildData.plugins.modlog);

		guildData.set("plugins.modlog", { channel, events, ignoredChannels });
		await guildData.save();

		const after = serialize(guildData.plugins.modlog);
		await logAction(req, guild.id, { action: "modlog.settings", details: { before, after } });

		return send(reply, after);
	});
}
