import { Client } from "discord.js";
import { config } from "../config.js";
import { init as initCommands } from "../handlers/command-handler/index.js";
import { init as initEvents } from "../handlers/event-handler/index.js";

export class ExtendedClient extends Client {
	/**
	 * @param {import("discord.js").ClientOptions} options
	 */
	constructor(options) {
		super(options);
	}

	async init() {
		this.login(config.token).then(async () => await Promise.all([initCommands(), initEvents()]).catch(console.error));
	}
}
