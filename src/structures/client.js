import { Client } from "discord.js";
import MongooseAdapter from "../adapters/database/MongooseAdapter.js";
import { init as initCommands } from "../handlers/command-handler/index.js";
import { init as initEvents } from "../handlers/event-handler/index.js";
import logger from "../helpers/logger.js";
import ConfigService from "../services/config/index.js";
import InternationalizationService from "../services/languages/index.js";
import { SUPER_CONTEXT } from "../constants/index.js";

export class ExtendedClient extends Client {
	/**
	 * @param {import("discord.js").ClientOptions} options
	 */
	constructor(options) {
		if (SUPER_CONTEXT.getStore()) {
			return SUPER_CONTEXT.getStore();
		}
		super(options);

		this.configService = new ConfigService();
		this.adapter = new MongooseAdapter(this.configService.get("mongoDB"));
		this.i18n = new InternationalizationService(this);

		SUPER_CONTEXT.enterWith(this);
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
