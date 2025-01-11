import logger from "../../../helpers/logger.js";
import differentCommands from "../utils/differentcommands.js";

export default async function registerCommands(props) {
	props.client.once("ready", () => handleRegistration(props.client, props.commands));
}

const handleRegistration = async (client, commands) => {
	const devOnlyCommands = commands.filter(cmd => cmd.options?.devOnly);
	const globalCommands = commands.filter(cmd => !cmd.options?.devOnly);

	const devGuildsIds = client.configService.get("devGuildsIds");

	await registerGlobalCommands(client, globalCommands);
	await registerDevCommands(client, devOnlyCommands, devGuildsIds);
};

/**
 *
 * @param {import("../../../structures/client.js").ExtendedClient} client
 * @param {*} commands
 */
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

/**
 *
 * @param {import("../../../structures/client.js").ExtendedClient} client
 * @param {*} commands
 */
const registerDevCommands = async (client, commands, guildsIds) => {
	const devGuilds = [];

	for (const guildId of guildsIds) {
		const guild = client.guilds.cache.get(guildId) || (await client.guilds.fetch(guildId));

		if (!guild) {
			logger.error(`Could not register dev commands, guild ${guildId} not found`);
			continue;
		}

		devGuilds.push(guild);
	}

	const guildCommandsManagers = [];

	for (const guild of devGuilds) {
		const guildCommandsManager = guild.commands;
		await guildCommandsManager.fetch();

		guildCommandsManagers.push(guildCommandsManager);
	}

	await Promise.all(
		commands.map(async ({ data }) => {
			guildCommandsManagers.map(async guildCommands => {
				const targetCommand = guildCommands.cache.find(cmd => cmd.name === data.name);
				if (targetCommand && differentCommands(targetCommand, data)) {
					await targetCommand.edit(data).catch(() => logger.error(`Failed to update command: ${data.name} in ${guildCommands.guild.name} server`));

					logger.log(`Edited command globally: ${data.name}`);
				} else if (!targetCommand) {
					await guildCommands.create(data).catch(() => logger.error(`Failed to register command: ${data.name} in ${guildCommands.guild.name} server`));
				}
			});
		}),
	);

	logger.log(`Registered dev commands in ${devGuilds.length} server(s)`);
};
