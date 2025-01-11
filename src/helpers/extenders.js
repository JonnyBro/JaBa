import { BaseInteraction } from "discord.js";
import useClient from "../utils/use-client.js";

export const getLocale = guildId => {
	const client = useClient();
	const guild = client.getGuildData(guildId);
	return guild.language;
};

const getAppEmojis = () => {
	const client = useClient();

	return client.application.emojis.cache;
};

/**
 *
 * @param {import('../structures/client.js').ExtendedClient} client
 * @param {string} prefixEmoji
 * @param {string} message
 */
const formatReply = (prefixEmoji, message) => {
	const emojis = getAppEmojis();
	return prefixEmoji ? `${emojis.find(e => e.name === prefixEmoji).toString()} ${message}` : `${message}`;
};

/**
 *
 * @param {import("discord.js").User} user
 * @returns
 */
export const getUsername = user => (user.discriminator === "0" ? user.username : user.tag);

/**
 *
 * @param {import("discord.js").Message | import("discord.js").BaseInteraction} context
 * @param {string} key
 * @param {unknown[]} args
 * @param {*} options
 */
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
