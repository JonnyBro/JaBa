import { join } from "node:path";
import logger from "@/helpers/logger.js";
import { getFilePaths } from "@/utils/get-path.js";
import { toFileURL } from "@/utils/resolve-file.js";
import { ExtendedClient } from "@/structures/client.js";
import { ClientEvents } from "discord.js";
import { PROJECT_ROOT } from "@/constants/index.js";

type EventHandlerEvents = {
	data: {
		name: keyof ClientEvents;
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
				this.client.rainlink.addListener(event.data.name, event.run);
			} else {
				if (event.data.once) this.client.once(event.data.name, event.run);
				else this.client.on(event.data.name, event.run);
			}
		});
	}
}
