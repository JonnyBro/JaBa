import { translateContext } from "@/helpers/functions.js";
import { syncWarnings } from "@/helpers/honeypot.js";
import { HONEYPOT_ACTIONS, HoneypotAction, HoneypotSettings } from "@/models/GuildModel.js";
import useClient from "@/utils/use-client.js";
import { PermissionsBitField } from "discord.js";
import { FastifyInstance } from "fastify";
import { logAction } from "../../audit.js";
import { getSendableChannel } from "../../channels.js";
import { fail, send } from "../../utils.js";

const MAX_CHANNELS = 5;
const MAX_TEXT = 2000;

const serialize = (settings: HoneypotSettings) => ({
	channels: settings.channels.map(channel => channel.id),
	action: settings.action,
	deleteHours: settings.deleteHours,
	timeoutMinutes: settings.timeoutMinutes,
	dm: settings.dm,
	warning: settings.warning,
	warningText: settings.warningText,
});

const isIntIn = (value: unknown, min: number, max: number): value is number =>
	Number.isInteger(value) && (value as number) >= min && (value as number) <= max;

export default async function honeypotRoutes(fastify: FastifyInstance) {
	fastify.get("/honeypot", async (req, reply) => {
		const guildData = await useClient().getGuildData(req.guild.id);
		const permissions = req.guild.members.me?.permissions;
		const defaultWarnings = Object.fromEntries(
			await Promise.all(
				HONEYPOT_ACTIONS.map(async action => [
					action,
					await translateContext(req.guild, `honeypot:WARNING_${action.toUpperCase()}`),
				]),
			),
		);

		return send(reply, {
			settings: serialize(guildData.plugins.honeypot),
			canBan: !!permissions?.has(PermissionsBitField.Flags.BanMembers),
			canTimeout: !!permissions?.has(PermissionsBitField.Flags.ModerateMembers),
			canManageMessages: !!permissions?.has(PermissionsBitField.Flags.ManageMessages),
			defaultWarnings,
		});
	});

	fastify.put("/honeypot", async (req, reply) => {
		const guild = req.guild;
		const body = (req.body ?? {}) as Record<string, unknown>;

		const ids = Array.isArray(body.channels) ? [...new Set(body.channels)] : [];
		if (ids.length > MAX_CHANNELS) return fail(reply, 400, `There can be up to ${MAX_CHANNELS} trap channels`);

		const channels: string[] = [];
		for (const id of ids) {
			const channel = getSendableChannel(guild, id, [PermissionsBitField.Flags.ManageMessages]);
			if (!channel) return fail(reply, 400, "The bot needs to send and delete messages in the trap channels");

			channels.push(channel.id);
		}

		if (!HONEYPOT_ACTIONS.includes(body.action as HoneypotAction)) return fail(reply, 400, "Unknown action");
		if (!isIntIn(body.deleteHours, 0, 168)) return fail(reply, 400, "Messages can be deleted for up to 168 hours");
		if (!isIntIn(body.timeoutMinutes, 1, 40320)) return fail(reply, 400, "A timeout can last up to 28 days");

		const text = typeof body.warningText === "string" ? body.warningText.trim() : "";
		if (text.length > MAX_TEXT) return fail(reply, 400, `The warning can be up to ${MAX_TEXT} characters`);

		const guildData = await useClient().getGuildData(guild.id);
		const before = serialize(guildData.plugins.honeypot);

		const settings = {
			action: body.action as HoneypotAction,
			deleteHours: body.deleteHours,
			timeoutMinutes: body.timeoutMinutes,
			dm: body.dm === true,
			warning: body.warning === true,
			warningText: text || null,
		};
		const synced = await syncWarnings(guild, guildData.plugins.honeypot.channels, { ...settings, channels });

		guildData.set("plugins.honeypot", { ...settings, channels: synced });
		await guildData.save();

		const after = serialize(guildData.plugins.honeypot);
		await logAction(req, guild.id, { action: "honeypot.settings", details: { before, after } });

		return send(reply, after);
	});
}
