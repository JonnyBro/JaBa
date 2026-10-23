import useClient from "@/utils/use-client.js";
import { FastifyInstance } from "fastify";
import { logAction } from "../../audit.js";
import { fail, send } from "../../utils.js";

export const getSettings = async (guildId: string) => {
	const guildData = await useClient().getGuildData(guildId);

	return { language: guildData.language, birthdays: guildData.plugins.birthdays };
};

export default async function settingsRoutes(fastify: FastifyInstance) {
	fastify.patch("/settings", async (req, reply) => {
		const guild = req.guild;
		const body = (req.body ?? {}) as { language?: unknown; birthdays?: unknown };
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

		await guildData.save();

		const after = await getSettings(guild.id);
		await logAction(req, guild.id, { action: "settings.update", details: { before, after } });

		return send(reply, after);
	});
}
