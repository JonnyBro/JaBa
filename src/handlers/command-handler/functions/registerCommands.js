import logger from "../../../helpers/logger.js";
import differentCommands from "../utils/differentcommands.js";

export default async function registerCommands(props) {
	const globalCommands = props.commands.filter(cmd => !cmd.options?.devOnly);
	props.client.once("ready", () => registerGlobalCommands(props.client, globalCommands));
}

const registerGlobalCommands = async (client, commands) => {
	const appCommandsManager = client.application.commands;
	await appCommandsManager.fetch();

	await Promise.all(
		commands.map(async ({ data }) => {
			const targetCommand = appCommandsManager.cache.find(cmd => cmd.name === data.name);

			if (targetCommand && differentCommands(targetCommand, data)) {
				await targetCommand.edit(data).catch(() => logger.error(`Failed to update command: ${data.name} globally`));

				logger.log(`Edited command globally: ${data.name}`);
			} else if (!targetCommand) {
				await appCommandsManager.create(data).catch(() => logger.error(`Failed to register command: ${data.name}`));
			}
		}),
	);

	logger.log("Registered global commands");
};