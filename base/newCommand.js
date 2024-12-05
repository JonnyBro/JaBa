export default class Command {
	constructor(options) {
		/**
		 * @type {import("discord.js").ApplicationCommandData}
		 */
		this.data = options.data;
		/**
		 * @type {Boolean}
		 */
		this.ownerOnly = !!options.ownerOnly || false;
		/**
		 * @param {import("discord.js").CommandInteraction} [interaction]
		 * @param {import('./newClient.js').ExtendedClient} [client]
		 * @param {import("discord.js").CommandInteractionOptionResolver} [args]
		 */
		this.execute = function () {};
	}
}
