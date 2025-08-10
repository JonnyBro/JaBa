import { join } from "node:path";
import logger from "@/helpers/logger.js";
import { getFilePaths } from "@/utils/get-path.js";
import { toFileURL } from "@/utils/resolve-file.js";
import registerCommands from "./functions/registerCommands.js";
import { ExtendedClient } from "@/structures/client.js";
import { BuiltInValidation, CommandFileObject } from "@/types.js";
import builtInValidationsFunctions from "./validations/index.js";
import { PROJECT_ROOT } from "@/constants/index.js";

export class CommandHandler {
	client: ExtendedClient;
	commands: CommandFileObject[] = [];
	builtInValidations: BuiltInValidation[] = [];

	constructor(client: ExtendedClient) {
		this.client = client;
	}

	async init() {
		await this.#buildCommands();

		this.buildBuiltInValidations();

		await registerCommands({
			client: this.client,
			commands: this.commands,
		});

		this.client.commands = this.commands;

		this.handleCommands();
	}

	async #buildCommands() {
		const cmdPath = join(PROJECT_ROOT, "commands");
		const commandFilePaths = (await getFilePaths(cmdPath, true)).filter(
			path => path.endsWith(".js") || path.endsWith(".ts"),
		);

		for (const cmdFilePath of commandFilePaths) {
			const { data, run, options, autocompleteRun } = await import(toFileURL(cmdFilePath));

			if (!data || !data.name) {
				logger.warn(`Command ${cmdFilePath} does not have a 'data' object or name`);
				continue;
			}

			if (typeof run !== "function") {
				logger.warn(
					`Command ${cmdFilePath} does not have a 'run' function or it is not a function`,
				);
				continue;
			}

			this.commands.push({ data, run, options, autocompleteRun, filePath: cmdFilePath });
		}
	}

	buildBuiltInValidations() {
		for (const builtInValidationFunction of builtInValidationsFunctions) {
			this.builtInValidations.push(builtInValidationFunction);
		}
	}

	handleCommands() {
		this.client.on("interactionCreate", async interaction => {
			if (
				!interaction.isChatInputCommand() &&
				!interaction.isAutocomplete() &&
				!interaction.isContextMenuCommand()
			) return;

			const isAutocomplete = interaction.isAutocomplete();

			const targetCommand = this.commands.find(
				cmd => cmd.data.name === interaction.commandName,
			);
			if (!targetCommand) return;

			// Skip if autocomplete handler is not defined
			if (isAutocomplete && !targetCommand.autocompleteRun) return;

			let canRun = true;

			for (const validation of this.builtInValidations) {
				const stopValidationLoop = validation({
					targetCommand,
					interaction,
					client: this.client,
				});

				if (stopValidationLoop) {
					canRun = false;
					break;
				}
			}

			if (!canRun) return;

			const command = targetCommand[isAutocomplete ? "autocompleteRun" : "run"]!;


			try {
				await command({
					client: this.client,
					interaction,
				});
			} catch (error) {
				logger.error(error, "Command cannot be executed");
			}
		});
	}
}
