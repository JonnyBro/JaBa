import { PROJECT_ROOT } from "@/constants/index.js";
import logger from "@/helpers/logger.js";
import { ExtendedClient } from "@/structures/client.js";
import { getFilePaths } from "@/utils/get-path.js";
import { toFileURL } from "@/utils/resolve-file.js";
import { ClientEvents } from "discord.js";
import { join } from "node:path";
import { RainlinkEventsInterface } from "rainlink";

type EventHandlerEvents = {
	data: {
		name: string;
		once?: boolean;
		player?: boolean;
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

		logger.log(`Loaded ${eventFilePaths.length} event(s)`);
	}

	$registerEvents() {
		this.events.forEach(event => {
			if (event.data.player) {
				const eventName = event.data.name as keyof RainlinkEventsInterface;

				if (event.data.once) this.client.rainlink.once(eventName, event.run);
				else this.client.rainlink.on(eventName, event.run);
			} else {
				const eventName = event.data.name as keyof ClientEvents;

				if (event.data.once) this.client.once(eventName, event.run);
				else this.client.on(eventName, event.run);
			}
		});
	}
}
