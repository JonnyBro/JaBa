import { PROJECT_ROOT } from "@/constants/index.js";
import logger from "@/helpers/logger.js";
import { ExtendedClient } from "@/structures/client.js";
import { getFilePaths } from "@/utils/get-path.js";
import { toFileURL } from "@/utils/resolve-file.js";
import { ClientEvents } from "discord.js";
import { LavalinkManagerEvents, NodeManagerEvents } from "lavalink-client";
import { join } from "node:path";

type EventHandlerEvents = {
	data: {
		name: string;
		player?: boolean;
		node?: boolean;
		once?: boolean;
	};
	run: (...args: unknown[]) => void;
};

export class EventHandler {
	events: EventHandlerEvents[] = [];
	client: ExtendedClient;
	constructor(client: ExtendedClient) {
		this.client = client;
	}

	async init() {
		await this.#buildEvents();
		this.$registerEvents();
	}

	async #buildEvents() {
		const eventPath = join(PROJECT_ROOT, "events");
		const eventFilePaths = (await getFilePaths(eventPath, true)).filter(
			path => path.endsWith(".js") || path.endsWith(".ts"),
		);

		try {
			for (const eventFilePath of eventFilePaths) {
				const eventModule = await import(toFileURL(eventFilePath));

				if (!("data" in eventModule) || !("run" in eventModule)) {
					logger.warn(`Event ${eventFilePath} does not have a data object or name`);
					continue;
				}

				const { data, run } = eventModule;

				if (!data.name) {
					logger.warn(`Event ${eventFilePath} does not have a data object or name`);
					continue;
				}

				if (typeof run !== "function") {
					logger.warn(`Event ${eventFilePath} does not have a 'run' function`);
					continue;
				}

				this.events.push({ data, run });

				logger.debug(`Event ${eventFilePath} loaded`);
			}
		} catch (error) {
			logger.error("Error build events: ", error);
		}

		logger.info(`Loaded ${eventFilePaths.length} event(s)`);
	}

	$registerEvents() {
		this.events.forEach(event => {
			const once = event.data.once;

			if (event.data.node) {
				const eventName = event.data.name as keyof NodeManagerEvents;

				if (once) this.client.lavalink.nodeManager.once(eventName, event.run);
				else this.client.lavalink.nodeManager.on(eventName, event.run);

				return;
			}

			if (event.data.player) {
				const eventName = event.data.name as keyof LavalinkManagerEvents;

				if (once) this.client.lavalink.once(eventName, event.run);
				else this.client.lavalink.on(eventName, event.run);

				return;
			}

			const eventName = event.data.name as keyof ClientEvents;

			if (once) this.client.once(eventName, event.run);
			else this.client.on(eventName, event.run);
		});
	}
}
