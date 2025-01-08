import { resolve } from "node:path";
import logger from "../../helpers/logger.js";
import { getFilePaths } from "../../utils/index.js";
import { toFileURL } from "../../utils/resolve-file.js";
import { useMainPlayer } from "discord-player";

export class EventHandler {
	constructor(client) {
		this.events = [];
		this.client = client;
	}

	async init() {
		await this.#buildEvents();
		this.$registerEvents();
	}

	async #buildEvents() {
		try {
			const eventPath = resolve(this.client.configService.get("paths.events"));
			const eventFilePaths = (await getFilePaths(eventPath, true)).filter(path => path.endsWith(".js"));

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
		const player = useMainPlayer();
		for (const { data, run } of this.events) {
			if (data.player) player.events.on(data.name, run);
			if (data.once) this.client.once(data.name, run);
			else this.client.on(data.name, run);
		}
	}
}
