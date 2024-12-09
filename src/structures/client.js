import { Client } from "discord.js";
import { config } from "../../config.js";
import MongooseAdapter from "../adapters/database/MongooseAdapter.js";
import { init as initCommands } from "../handlers/command-handler/index.js";
import { init as initEvents } from "../handlers/event-handler/index.js";
import logger from "../helpers/logger.js";

export class ExtendedClient extends Client {
	/**
	 * @param {import("discord.js").ClientOptions} options
	 */
	constructor(options) {
		super(options);
		this.adapter = new MongooseAdapter(config.mongoDB);
	}

	async init() {
		try {
			await this.adapter.connect();

			return this.login(config.token)
				.then(async () => await Promise.all([initCommands(), initEvents()]))
				.catch(console.error);
		} catch (error) {
			logger.error(error);
		}
	}
}
