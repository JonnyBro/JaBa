import useClient from "@/utils/use-client.js";
import { BaseInteraction, CacheType, Interaction, InteractionReplyOptions, Message, MessageFlags, User } from "discord.js";

interface Options extends InteractionReplyOptions {
	prefixEmoji?: string;
	locale?: string;
	edit?: boolean;
	ephemeral?: boolean;
	mention?: boolean;
}

export const getLocale = async (guildId: string) => {
	const client = useClient();
	const guild = await client.getGuildData(guildId);
	return guild.language;
};

export const getLocalizedDesc = (key: string) => {
	const client = useClient();

	return {
		description: client.i18n.translate(key),
		// eslint-disable-next-line camelcase
		description_localizations: {
			ru: client.i18n.translate(key, { lng: "ru-RU" }),
			uk: client.i18n.translate(key, { lng: "uk-UA" }),
		},
	};
};

const getAppEmojis = () => {
	const client = useClient();

	return client.application.emojis.cache;
};

const formatReply = (message: string, prefixEmoji?: string) => {
	const emojis = getAppEmojis();
	const emoji = emojis.find(emoji => emoji.name === prefixEmoji) || ":white_small_square:";
	return prefixEmoji ? `${emoji.toString()} ${message}` : `${message}`;
};

export const getUsername = (user: User) => (user.discriminator === "0" ? user.username : user.tag);

export const translateContext = async <T extends CacheType = CacheType>(context: Interaction<T> | Message, key: string, args?: Record<string, unknown> | null, options?: Options) => {
	const client = useClient();
	const inGuild = context.guild ? await getLocale(context.guild.id) : "";

	const locale = options?.locale || inGuild || client.configService.get("defaultLang");
	const translated = client.i18n.translate(key, {
		lng: locale,
		...args,
	});

	return translated;
};

export const replyTranslated = async <T extends CacheType = CacheType>(context: Interaction<T> | Message, key: string, args?: Record<string, unknown> | null, options?: Options) => {
	const translated = await translateContext(context, key, args, options);
	const content = formatReply(translated, options?.prefixEmoji);

	if (context instanceof BaseInteraction) {
		if (!context.isRepliable()) return;

		if (options?.edit) return await context.editReply({ content });

		await context.reply({
			content,
			flags: options?.ephemeral ? MessageFlags.Ephemeral : undefined,
		});

		return;
	}

	if (options?.edit) return await context.edit({ content, allowedMentions: { repliedUser: options.mention || false } });

	await context.reply({
		content,
		allowedMentions: { repliedUser: options?.mention || false },
	});
};

export const replySuccess = async <T extends CacheType = CacheType>(context: Interaction<T> | Message, key: string, args?: Record<string, unknown> | null, options: Options = { prefixEmoji: "success" }) =>
	await replyTranslated(context, key, args, { prefixEmoji: "success", ...options });

export const editReplySuccess = async <T extends CacheType = CacheType>(context: Interaction<T> | Message, key: string, args?: Record<string, unknown> | null, options: Options = { prefixEmoji: "success", edit: true }) =>
	await replyTranslated(context, key, args, { prefixEmoji: "success", edit: true, ...options });

export const replyError = async <T extends CacheType = CacheType>(context: Interaction<T> | Message, key: string, args?: Record<string, unknown> | null, options: Options = { prefixEmoji: "error" }) =>
	await replyTranslated(context, key, args, { prefixEmoji: "error", ...options });

export const editReplyError = async <T extends CacheType = CacheType>(context: Interaction<T> | Message, key: string, args?: Record<string, unknown> | null, options: Options = { prefixEmoji: "error", edit: true }) =>
	await replyTranslated(context, key, args, { prefixEmoji: "error", edit: true, ...options });
