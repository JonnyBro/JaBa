/* eslint-disable no-unused-vars */
class BaseCommand {
	constructor(options, client) {
		/**
		 * @type {import("@discordjs/builders").SlashCommandBuilder | import("discord.js").ApplicationCommandData}
		 */
		this.command = options.command;
		/**
		 * @type {Array<String>}
		 */
		this.aliases = options.aliases || [];
		/**
		 * @type {Boolean}
		 */
		this.guildOnly = options.guildOnly || true;
		/**
		 * @type {Boolean}
		 */
		this.ownerOnly = options.ownerOnly || false;
	}
}

module.exports = BaseCommand;