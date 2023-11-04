const { Message, BaseInteraction, User } = require("discord.js");

User.prototype.getUsername = function () {
	return this.discriminator === "0" ? this.username : this.tag;
};

BaseInteraction.prototype.translate = function (key, args, emoji) {
	const lang = this.client.translations.get(this.guild.data.language ?? "en-US");
	const string = emoji !== undefined ? `${this.client.customEmojis[emoji]} | ${lang(key, args)}` : lang(key, args);

	return string;
};

BaseInteraction.prototype.replyT = function (key, args, options = {}) {
	const translated = this.translate(key, args, this.guild.data.language ?? "en-US");
	const string = options.prefixEmoji ? `${this.client.customEmojis[options.prefixEmoji]} | ${translated}` : translated;

	if (options.edit) return this.editReply({ content: string, ephemeral: options.ephemeral || false });
	else return this.reply({ content: string, ephemeral: options.ephemeral || false });
};

BaseInteraction.prototype.success = function (key, args, options = {}) {
	options.prefixEmoji = "success";

	return this.replyT(key, args, options);
};

BaseInteraction.prototype.error = function (key, args, options = {}) {
	options.prefixEmoji = "error";

	return this.replyT(key, args, options);
};

Message.prototype.translate = function (key, args, emoji) {
	const lang = this.client.translations.get(this.guild.data.language ?? "en-US");
	const string = emoji !== undefined ? `${this.client.customEmojis[emoji]} | ${lang(key, args)}` : lang(key, args);

	return string;
};

Message.prototype.replyT = function (key, args, options = {}) {
	const translated = this.translate(key, args, this.guild.data.language ?? "en-US");
	const string = options.prefixEmoji ? `${this.client.customEmojis[options.prefixEmoji]} | ${translated}` : translated;

	if (options.edit) return this.edit({ content: string, allowedMentions: { repliedUser: options.mention ? true : false } });
	else return this.reply({ content: string, allowedMentions: { repliedUser: options.mention ? true : false } });
};

Message.prototype.success = function (key, args, options = {}) {
	options.prefixEmoji = "success";

	return this.replyT(key, args, options);
};

Message.prototype.error = function (key, args, options = {}) {
	options.prefixEmoji = "error";

	return this.replyT(key, args, options);
};
