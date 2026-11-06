import useClient from "@/utils/use-client.js";
import { FastifyInstance } from "fastify";
import { logAction } from "../../audit.js";
import { fail, send } from "../../utils.js";

export const getSettings = async (guildId: string) => {
	const guildData = await useClient().getGuildData(guildId);

	return {
		language: guildData.language,
		birthdays: guildData.plugins.birthdays,
		djRole: guildData.plugins.music.djRole,
		musicStay: guildData.plugins.music.stay,
	};
};

export default async function settingsRoutes(fastify: FastifyInstance) {
	fastify.patch("/settings", async (req, reply) => {
		const guild = req.guild;
		const body = (req.body ?? {}) as {
			language?: unknown;
			birthdays?: unknown;
			djRole?: unknown;
			musicStay?: unknown;
		};
		const guildData = await useClient().getGuildData(guild.id);
		const before = await getSettings(guild.id);

		if (body.language !== undefined) {
			if (typeof body.language !== "string" || !useClient().i18n.SupportedLanguages.includes(body.language))
				return fail(reply, 400, "Unsupported language");

			guildData.set("language", body.language);
		}

		if (body.birthdays !== undefined) {
			const channel = typeof body.birthdays === "string" ? guild.channels.cache.get(body.birthdays) : null;

			if (body.birthdays !== null && !channel?.isTextBased()) return fail(reply, 400, "Unknown channel");

			guildData.set("plugins.birthdays", channel?.id ?? null);
		}

		if (body.djRole !== undefined) {
			const role = typeof body.djRole === "string" ? guild.roles.cache.get(body.djRole) : null;
			if (body.djRole !== null && (!role || role.id === guild.id)) return fail(reply, 400, "Unknown role");

			guildData.set("plugins.music.djRole", role?.id ?? null);
		}

		if (body.musicStay !== undefined) guildData.set("plugins.music.stay", body.musicStay === true);

		await guildData.save();

		const after = await getSettings(guild.id);
		await logAction(req, guild.id, { action: "settings.update", details: { before, after } });

		return send(reply, after);
	});
}
