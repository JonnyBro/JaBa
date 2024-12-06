import { client } from "../../index.js";
import { getFilePaths } from "../../utils/get-path.js";
import { toFileURL } from "../../utils/resolve-file.js";

export const events = [];

export const init = async () => {
	await buildEvents();

	registerEvents();
};

const buildEvents = async () => {
	const eventFilePaths = (await getFilePaths("./newEvents", true)).filter(path => path.endsWith(".js"));

	for (const eventFilePath of eventFilePaths) {
		const { data, run } = await import(toFileURL(eventFilePath));

		if (!data || !data.name) {
			console.warn(`Event ${eventFilePath} does not have a data object or name`);
			continue;
		}

		if (typeof run !== "function") {
			console.warn(`Event ${eventFilePath} does not have a run function or it is not a function`);
			continue;
		}

		events.push({ data, run });
	}
};

const registerEvents = () => {
	for (const { data, run } of events) {
		if (data.once) {
			client.once(data.name, run);
		} else {
			client.on(data.name, run);
		}
	}
};
