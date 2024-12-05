/* eslint-disable no-unused-vars */
import { sep } from "path";

class BaseCommand {
	constructor(options, client) {
		/**
		 * @type {import("discord.js").SlashCommandBuilder | import("discord.js").ContextMenuCommandBuilder | import("discord.js").ApplicationCommandData}
		 */
		this.command = options.command;
		/**
		 * @type {Boolean}
		 */
		this.ownerOnly = (options.ownerOnly === true ? true : false) || false;
		this.dirname = options.dirname || false;
		/**
		 * @type {String}
		 */
		this.category = this.dirname ? this.dirname.split(sep)[parseInt(this.dirname.split(sep).length - 1, 10)] : "Other";
	}
}

export default BaseCommand;
