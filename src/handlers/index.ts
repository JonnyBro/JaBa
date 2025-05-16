import { ExtendedClient } from "@/structures/client.js";
import { CommandHandler } from "./command-handler/index.js";
import { EventHandler } from "./event-handler/index.js";

export class Handlers {
	client: ExtendedClient;
	constructor(client: ExtendedClient) {
		this.client = client;

		this.init();
	}

	private async init() {
		const eventHandler = new EventHandler(this.client);
		await eventHandler.init();

		const commandHandler = new CommandHandler(this.client);
		await commandHandler.init();
	}
}
