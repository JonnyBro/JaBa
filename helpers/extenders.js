const { Message, Interaction } = require("discord.js");

Message.prototype.translate = function (key, args) {
	const language = this.client.translations.get(this.guild ? this.guild.data.language : "ru-RU");
	if (!language) throw "Message: Invalid language set in data.";

	return language(key, args);
};

Message.prototype.replyT = function (key, args, options = {}) {
	let string = this.translate(key, args, this.guild ? this.guild.data.language : "ru-RU");
	if (options.prefixEmoji) string = `${this.client.customEmojis[options.prefixEmoji]} | ${string}`;

	if (options.edit) return this.edit(string);
	else return this.reply({ content: string });
};

Message.prototype.error = function (key, args, options = {}) {
	options.prefixEmoji = "error";

	return this.replyT(key, args, options);
};

Message.prototype.success = function (key, args, options = {}) {
	options.prefixEmoji = "success";

	return this.replyT(key, args, options);
};

Interaction.prototype.translate = function (key, args) {
	const language = this.client.translations.get(this.guild ? this.guild.data.language : "ru-RU");
	if (!language) throw "Message: Invalid language set in data.";

	return language(key, args);
};

Interaction.prototype.replyT = function (key, args, options = {}) {
	let string = this.translate(key, args, this.guild ? this.guild.data.language : "ru-RU");
	if (options.prefixEmoji) string = `${this.client.customEmojis[options.prefixEmoji]} | ${string}`;

	if (options.edit) return this.editReply(string);
	else return this.reply({ content: string, ephemeral: options.ephemeral || false, fetchReply: options.fetchReply || false });
};

Interaction.prototype.error = function (key, args, options = {}) {
	options.prefixEmoji = "error";

	return this.replyT(key, args, options);
};

Interaction.prototype.success = function (key, args, options = {}) {
	options.prefixEmoji = "success";

	return this.replyT(key, args, options);
};