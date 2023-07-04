/* eslint-disable no-unused-vars */
const path = require("path");

class BaseCommand {
	constructor(options, client) {
		/**
		 * @type {import("discord.js").SlashCommandBuilder | import("discord.js").ContextMenuCommandBuilder | import("discord.js").ApplicationCommandData}
		 */
		this.command = options.command;
		/**
		 * @type {Array<String>}
		 */
		this.aliases = options.aliases || [];
		/**
		 * @type {Boolean}
		 */
		this.ownerOnly = (options.ownerOnly === true ? true : false) || false;
		this.dirname = options.dirname || false;
		/**
		 * @type {String}
		 */
		this.category = this.dirname ? this.dirname.split(path.sep)[parseInt(this.dirname.split(path.sep).length - 1, 10)] : "Other";
	}
}

module.exports = BaseCommand;
