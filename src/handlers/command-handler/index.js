import { resolve } from "node:path";
import logger from "../../helpers/logger.js";
import { getFilePaths } from "../../utils/index.js";
import { toFileURL } from "../../utils/resolve-file.js";
import registerCommands from "./functions/registerCommands.js";

export class CommandHandler {
	constructor(client) {
		/**
		 * @type {import("../../structures/client.js").ExtendedClient} client
		 */
		this.client = client;
		this.commands = [];
	}

	async init() {
		await this.#buildCommands();

		await registerCommands({
			client: this.client,
			commands: this.commands,
		});

		this.handleCommands();
	}

	async #buildCommands() {
		const cmdPath = resolve(this.client.configService.get("paths.commands"));
		const commandFilePaths = (await getFilePaths(cmdPath, true)).filter(path => path.endsWith(".js"));

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

			this.commands.push({ data, run });
		}
	}

	handleCommands() {
		this.client.on("interactionCreate", async interaction => {
			if (!interaction.isChatInputCommand() && !interaction.isAutocomplete()) return;

			const isAutocomplete = interaction.isAutocomplete();

			const targetCommand = this.commands.find(cmd => cmd.data.name === interaction.commandName);

			if (!targetCommand) return;
			// Skip if autocomplete handler is not defined
			if (isAutocomplete && !targetCommand.autocompleteRun) return;

			const command = targetCommand[isAutocomplete ? "autocompleteRun" : "run"];

			try {
				await command({
					client: this.client,
					interaction,
				});
			} catch (error) {
				logger.error(error);
			}
		});
	}
}
