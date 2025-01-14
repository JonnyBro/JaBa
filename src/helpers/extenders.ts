import { BaseInteraction, CacheType, Interaction, InteractionReplyOptions, Message, User } from "discord.js";
import useClient from "@/utils/use-client.js";

interface Options extends InteractionReplyOptions {
	prefixEmoji: string;
	locale?: string;
	edit?: boolean;
	mention?: boolean;
}

export const getLocale = async (guildId: string) => {
	const client = useClient();
	const guild = await client.getGuildData(guildId);
	return guild.language;
};

const getAppEmojis = () => {
	const client = useClient();

	return client.application.emojis.cache;
};

const formatReply = (prefixEmoji: string, message: string) => {
	const emojis = getAppEmojis();
	const emoji = emojis.find(emoji => emoji.name === prefixEmoji);
	return prefixEmoji ? `${emoji?.toString()} ${message}` : `${message}`;
};

export const getUsername = (user: User) => (user.discriminator === "0" ? user.username : user.tag);

export const replyTranslated = async <T extends CacheType = CacheType>(context: Interaction<T> | Message, key: string, args: unknown[], options: Options) => {
	const client = useClient();
	const locale = options.locale || client.configService.get("defaultLang");
	const translated = client.translate(key, {
		lng: locale,
		...args,
	});

	const content = formatReply(options.prefixEmoji, translated);

	if (context instanceof BaseInteraction) {
		if (!context.isRepliable()) return;

		if (options.edit) {
			await context.editReply({ content });
			return;
		}
		await context.reply({
			content,
			ephemeral: options.ephemeral || false,
		});
		return;
	}

	if (options.edit) {
		await context.edit({
			content,
			allowedMentions: { repliedUser: options.mention || false },
		});
		return;
	}
	await context.reply({
		content,
		allowedMentions: { repliedUser: options.mention || false },
	});
};

export const replySuccess = async <T extends CacheType = CacheType>(context: Interaction<T> | Message, key: string, args: unknown[], options: Options) => {
	options.prefixEmoji = "success";
	return await replyTranslated(context, key, args, options);
};

export const replyError = async <T extends CacheType = CacheType>(context: Interaction<T> | Message, key: string, args: unknown[], options: Options) => {
	options.prefixEmoji = "error";
	return await replyTranslated(context, key, args, options);
};
