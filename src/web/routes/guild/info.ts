import languageMeta from "@/services/languages/language-meta.js";
import useClient from "@/utils/use-client.js";
import { ChannelType } from "discord.js";
import { FastifyInstance } from "fastify";
import { send } from "../../utils.js";
import { getSettings } from "./settings.js";

export default async function infoRoutes(fastify: FastifyInstance) {
	fastify.get("/", async (req, reply) => {
		const guild = req.guild;
		const info = {
			id: guild.id,
			name: guild.name,
			icon: guild.iconURL({ size: 128 }),
			memberCount: guild.memberCount,
			embedColor: useClient().configService.get<string>("EMBED_COLOR") || null,
			canManage: req.canManage,
		};

		if (!req.canManage) return send(reply, info);

		const channels = guild.channels.cache
			.filter(c => c.type === ChannelType.GuildText || c.type === ChannelType.GuildAnnouncement)
			.sort((a, b) => a.rawPosition - b.rawPosition)
			.map(c => ({ id: c.id, name: c.name, category: c.parent?.name ?? null }));

		return send(reply, {
			...info,
			settings: await getSettings(guild.id),
			channels,
			languages: useClient().i18n.SupportedLanguages.map(locale => {
				const meta = languageMeta.find(l => l.locale === locale);

				return { locale, name: meta?.name ?? locale, nativeName: meta?.nativeName ?? locale };
			}),
		});
	});
}
