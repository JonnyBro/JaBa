import { resolve } from "node:path";
import logger from "../../helpers/logger.js";
import useClient from "../../utils/use-client.js";
import { getFilePaths } from "../../utils/index.js";
import { toFileURL } from "../../utils/resolve-file.js";
import { useMainPlayer } from "discord-player";

export const events = [];

export const init = async () => {
	await buildEvents();
	registerEvents();
};

const buildEvents = async () => {
	const client = useClient();
	try {
		const eventPath = resolve(client.configService.get("paths.events"));
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

			events.push({ data, run });
		}
	} catch (error) {
		logger.error("Error build events: ", error);
	}
};

const registerEvents = async () => {
	const client = useClient();
	const player = useMainPlayer();
	for (const { data, run } of events) {
		if (data.player) player.events.on(data.name, run);
		if (data.once) client.once(data.name, run);
		else client.on(data.name, run);
	}
};
