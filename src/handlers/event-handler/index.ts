import { resolve } from "node:path";
import logger from "@/helpers/logger.js";
import { getFilePaths } from "@/utils/get-path.js";
import { toFileURL } from "@/utils/resolve-file.js";
import { GuildQueueEvents, useMainPlayer } from "discord-player";
import { ExtendedClient } from "@/structures/client.js";
import { ClientEvents } from "discord.js";

interface EventHandlerEvents {
	data: {
		name: keyof ClientEvents;
		once?: boolean;
		player?: boolean;
	};
	run: Function;
}

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
		try {
			const eventPath = resolve(this.client.configService.get("paths.events"));
			const eventFilePaths = (await getFilePaths(eventPath, true)).filter(path => path.endsWith(".js") || path.endsWith(".ts"));

			for (const eventFilePath of eventFilePaths) {
				const { data, run } = await import(toFileURL(eventFilePath));

				if (!data || !data.name) {
					logger.warn(`Event ${eventFilePath} does not have a data object or name`);
					continue;
				}

				if (typeof run !== "function") {
					logger.warn(`Event ${eventFilePath} does not have a run function or it is not a function`);
					continue;
				}

				this.events.push({ data, run });
			}
		} catch (error) {
			logger.error("Error build events: ", error);
		}
		logger.log("Events loaded");
	}

	$registerEvents() {
		for (const { data, run } of this.events) {
			if (data.once) this.client.once(data.name, (...args) => run(...args));
			else this.client.on(data.name, (...args) => run(...args));
		}
	}
}
