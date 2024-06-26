const { Message, BaseInteraction, User, GuildMember } = require("discord.js");

User.prototype.getUsername = function () {
	return this.discriminator === "0" ? this.username : this.tag;
};

GuildMember.prototype.getUsername = function () {
	return this.user.discriminator === "0" ? this.user.username : this.user.tag;
};

BaseInteraction.prototype.getLocale = function () {
	return this.data?.guild?.language;
};

BaseInteraction.prototype.translate = function (key, args, locale) {
	const language = this.client.translations.get(this.getLocale() || locale || "en-US");
	if (!language) throw "Interaction: Invalid language set in data.";

	return language(key, args);
};

BaseInteraction.prototype.replyT = async function (key, args, options = {}) {
	const translated = this.translate(key, args, this.getLocale() || options.locale || "en-US");
	const string = options.prefixEmoji ? `${this.client.customEmojis[options.prefixEmoji]} | ${translated}` : translated;

	if (options.edit) return this.editReply({ content: string, ephemeral: options.ephemeral || false });
	else return this.reply({ content: string, ephemeral: options.ephemeral || false });
};

BaseInteraction.prototype.success = async function (key, args, options = {}) {
	options.prefixEmoji = "success";

	return this.replyT(key, args, options);
};

BaseInteraction.prototype.error = async function (key, args, options = {}) {
	options.prefixEmoji = "error";

	return this.replyT(key, args, options);
};

Message.prototype.getLocale = function () {
	return this.data?.guild?.language;
};

Message.prototype.translate = function (key, args, locale) {
	const language = this.client.translations.get(this.getLocale() || locale || "en-US");
	if (!language) throw "Message: Invalid language set in data.";

	return language(key, args);
};

Message.prototype.replyT = async function (key, args, options = {}) {
	const translated = this.translate(key, args, this.getLocale() || options.locale || "en-US");
	const string = options.prefixEmoji ? `${this.client.customEmojis[options.prefixEmoji]} | ${translated}` : translated;

	if (options.edit) return this.edit({ content: string, allowedMentions: { repliedUser: options.mention ? true : false } });
	else return this.reply({ content: string, allowedMentions: { repliedUser: options.mention ? true : false } });
};

Message.prototype.success = async function (key, args, options = {}) {
	options.prefixEmoji = "success";

	return this.replyT(key, args, options);
};

Message.prototype.error = async function (key, args, options = {}) {
	options.prefixEmoji = "error";

	return this.replyT(key, args, options);
};
