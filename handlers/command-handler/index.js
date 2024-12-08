import logger from "../../helpers/logger.js";
import { client } from "../../index.js";
import { getFilePaths } from "../../utils/get-path.js";
import { toFileURL } from "../../utils/resolve-file.js";
import registerCommands from "./functions/registerCommands.js";

export const commands = [];

export const init = async () => {
	await buildCommands();

	await registerCommands({
		client,
		commands,
	});
};

const buildCommands = async () => {
	const commandFilePaths = (await getFilePaths("./newCommands", true)).filter(path => path.endsWith(".js"));

	for (const cmdFilePath of commandFilePaths) {
		const { data, run } = await import(toFileURL(cmdFilePath));

		if (!data || !data.name) {
			logger.warn(`Command ${cmdFilePath} does not have a data object or name`);
			continue;
		}

		if (typeof run !== "function") {
			logger.warn(`Command ${cmdFilePath} does not have a run function or it is not a function`);
			continue;
		}

		commands.push({ data, run });
	}
};
