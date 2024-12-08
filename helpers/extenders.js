import { Message, BaseInteraction, User, GuildMember } from "discord.js";

/**
 *
 * @param {Message|BaseInteraction} context
 * @returns {string} Guild's language
 */
function getLocale(context) {
	return context.data?.guild?.language;
}

/**
 *
 * @param {import("../base/Client")} client
 * @param {string} key
 * @param {any[]} args
 * @param {string} locale
 * @returns {string} Localized string
 */
function translate(client, key, args, locale) {
	const language = client.translations.get(locale || "en-US");
	if (!language) throw "Can't find given localization.";

	return language(key, args);
}

/**
 *
 * @param {import("../base/Client")} client
 * @param {string} prefixEmoji
 * @param {string} message
 * @returns {string} Formatted message
 */
function formatReply(client, prefixEmoji, message) {
	return prefixEmoji ? `${client.customEmojis[prefixEmoji]} | ${message}` : message;
}

/**
 *
 * @param {Message|BaseInteraction} context
 * @param {string} key
 * @param {any[]} args
 * @param {string} options
 * @returns
 */
async function replyTranslated(context, key, args, options = {}) {
	const locale = options.locale || getLocale(context) || "en-US";
	const translated = translate(context.client, key, args, locale);
	const content = formatReply(context.client, options.prefixEmoji, translated);

	if (options.edit) return context.editReply ? await context.editReply({ content, ephemeral: options.ephemeral || false }) : await context.edit({ content, allowedMentions: { repliedUser: options.mention || false } });
	else return context.editReply ? await context.reply({ content, ephemeral: options.ephemeral || false }) : await context.reply({ content, allowedMentions: { repliedUser: options.mention || false } });
}

User.prototype.getUsername = function () {
	return this.discriminator === "0" ? this.username : this.tag;
};

GuildMember.prototype.getUsername = function () {
	return this.user.getUsername();
};

BaseInteraction.prototype.getLocale = function () {
	return getLocale(this);
};

BaseInteraction.prototype.translate = function (key, args, locale) {
	return translate(this.client, key, args, locale || this.getLocale());
};

BaseInteraction.prototype.replyT = async function (key, args, options = {}) {
	return await replyTranslated(this, key, args, options);
};

BaseInteraction.prototype.success = async function (key, args, options = {}) {
	options.prefixEmoji = "success";
	return await this.replyT(key, args, options);
};

BaseInteraction.prototype.error = async function (key, args, options = {}) {
	options.prefixEmoji = "error";
	return await this.replyT(key, args, options);
};

Message.prototype.getLocale = function () {
	return getLocale(this);
};

Message.prototype.translate = function (key, args, locale) {
	return translate(this.client, key, args, locale || this.getLocale());
};

Message.prototype.replyT = async function (key, args, options = {}) {
	return await replyTranslated(this, key, args, options);
};

Message.prototype.success = async function (key, args, options = {}) {
	options.prefixEmoji = "success";
	return await this.replyT(key, args, options);
};

Message.prototype.error = async function (key, args, options = {}) {
	options.prefixEmoji = "error";
	return await this.replyT(key, args, options);
};
