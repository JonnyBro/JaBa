import { BaseInteraction, User } from "discord.js";
import useClient from "@/utils/use-client.js";

export const getLocale = async (guildId: string) => {
	const client = useClient();
	const guild = await client.getGuildData(guildId);
	return guild.language;
};

const getAppEmojis = () => {
	const client = useClient();

	return client.application?.emojis.cache;
};

const formatReply = (prefixEmoji: string, message: string) => {
	const emojis = getAppEmojis()!;
	return prefixEmoji ? `${emojis.find(e => e.name === prefixEmoji).toString()} ${message}` : `${message}`;
};


export const getUsername = (user: User) => (user.discriminator === "0" ? user.username : user.tag);

export const replyTranslated = async (context, key, args, options = {}) => {
	const client = useClient();
	const locale = options.locale || client.configService.get("defaultLang");
	const translated = client.translate(key, {
		lng: locale,
		...args,
	});

	const content = formatReply(options.prefixEmoji, translated);

	const isInteraction = context instanceof BaseInteraction;

	if (options.edit) {
		return isInteraction
			? await context.editReply({
				content,
				ephemeral: options.ephemeral || false,
			})
			: await context.edit({ content, allowedMentions: { repliedUser: options.mention || false } });
	}
	return isInteraction
		? await context.reply({
			content,
			ephemeral: options.ephemeral || false,
		})
		: await context.reply({
			content,
			allowedMentions: { repliedUser: options.mention || false },
		});
};

export const replySuccess = async (context, key, args, options) => {
	options.prefixEmoji = "success";
	return await replyTranslated(context, key, args, options);
};

export const replyError = async (context, key, args, options) => {
	options.prefixEmoji = "error";
	return await replyTranslated(context, key, args, options);
};
