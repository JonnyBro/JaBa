import { ExtendedClient } from "@/structures/client.js";
import logger from "@/helpers/logger.js";
import differentCommands from "../utils/differentcommands.js";
import { CommandFileObject } from "@/types.js";
import { ApplicationCommandData, GuildApplicationCommandManager } from "discord.js";

type RegisterCommandProps = {
	client: ExtendedClient;
	commands: CommandFileObject[];
};

export default async function registerCommands(props: RegisterCommandProps) {
	props.client.once("ready", () => handleRegistration(props.client, props.commands));
}

const handleRegistration = async (client: ExtendedClient, commands: CommandFileObject[]) => {
	const devOnlyCommands = commands.filter(cmd => cmd.options?.devOnly);
	const globalCommands = commands.filter(cmd => !cmd.options?.devOnly);

	const devGuildsIds = client.configService.get<string[]>("devGuildsIds");

	await registerGlobalCommands(client, globalCommands);
	await registerDevCommands(client, devOnlyCommands, devGuildsIds);
};

const registerGlobalCommands = async (client: ExtendedClient, commands: CommandFileObject[]) => {
	const appCommandsManager = client.application!.commands;
	await appCommandsManager.fetch();

	await Promise.all(
		commands.map(async ({ data }) => {
			const targetCommand = appCommandsManager.cache.find(cmd => cmd.name === data.name);

			if (targetCommand && differentCommands(targetCommand, data)) {
				await targetCommand.edit(data as Partial<ApplicationCommandData>).catch(() => logger.error(`Failed to update command: ${data.name} globally`));

				logger.log(`Edited command globally: ${data.name}`);
			} else if (!targetCommand) {
				await appCommandsManager.create(data).catch(() => logger.error(`Failed to register command: ${data.name}`));
				logger.debug(`Command ${data.name} loaded globally`);
			}
		}),
	);

	logger.log(`Registered ${commands.length} global command(s)`);
};

const registerDevCommands = async (client: ExtendedClient, commands: CommandFileObject[], guildsIds: string[]) => {
	const devGuilds = [];

	for (const guildId of guildsIds) {
		const guild = client.guilds.cache.get(guildId) || (await client.guilds.fetch(guildId));

		if (!guild) {
			logger.error(`Could not register dev commands, guild ${guildId} not found`);
			continue;
		}

		devGuilds.push(guild);
	}

	const guildCommandsManagers: GuildApplicationCommandManager[] = [];

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
					await targetCommand.edit(data as Partial<ApplicationCommandData>).catch(() => logger.error(`Failed to update command: ${data.name} in ${guildCommands.guild.name} server`));

					logger.log(`Edited command in dev: ${data.name}`);
				} else if (!targetCommand) {
					await guildCommands.create(data).catch(() => logger.error(`Failed to register command: ${data.name} in ${guildCommands.guild.name} server`));
					logger.debug(`Command ${data.name} loaded in dev`);
				}
			});
		}),
	);

	logger.log(`Registered ${commands.length} dev command(s) in ${devGuilds.length} server(s)`);
};
