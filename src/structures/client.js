import { Client } from "discord.js";
import MongooseAdapter from "../adapters/database/MongooseAdapter.js";
import { init as initCommands } from "../handlers/command-handler/index.js";
import { init as initEvents } from "../handlers/event-handler/index.js";
import logger from "../helpers/logger.js";
import configService from "../services/config/index.js";

export class ExtendedClient extends Client {
	/**
	 * @param {import("discord.js").ClientOptions} options
	 */
	constructor(options) {
		super(options);

		this.configService = new configService();
		this.adapter = new MongooseAdapter(this.configService.get("mongoDB"));
	}

	async init() {
		try {
			await this.adapter.connect();

			return this.login(this.configService.get("token"))
				.then(async () => await Promise.all([initCommands(), initEvents()]))
				.catch(console.error);
		} catch (error) {
			logger.error(error);
		}
	}
}