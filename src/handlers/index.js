import { CommandHandler } from "./command-handler/index.js";
import { EventHandler } from "./event-handler/index.js";

export class Handlers {
	constructor(client) {
		this.client = client;

		this.#init();
	}

	async #init() {
		const eventHandler = new EventHandler(this.client);
		await eventHandler.init();

		const commandHandler = new CommandHandler(this.client);
		await commandHandler.init();
	}
}
