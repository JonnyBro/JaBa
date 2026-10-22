import logger from "@/helpers/logger.js";
import { ExtendedClient } from "@/structures/client.js";
import { CommandData, CommandFileObject } from "@/types.js";
import {
	ApplicationCommandData,
	ApplicationCommandManager,
	ApplicationCommandType,
	GuildApplicationCommandManager,
} from "discord.js";

type RegisterCommandProps = {
	client: ExtendedClient;
	commands: CommandFileObject[];
};

export default async function registerCommands(props: RegisterCommandProps) {
	props.client.once("clientReady", () => handleRegistration(props.client, props.commands));
}

const handleRegistration = async (client: ExtendedClient, commands: CommandFileObject[]) => {
	const devOnlyCommands = commands.filter(cmd => cmd.options?.devOnly);
	const globalCommands = commands.filter(cmd => !cmd.options?.devOnly);

	await syncCommands(client.application!.commands, globalCommands, "global");

	const devGuildsIds = client.configService.get<string>("DEV_GUILDS_IDS").split(" ").filter(Boolean);

	for (const guildId of devGuildsIds) {
		const guild = client.guilds.cache.get(guildId) || (await client.guilds.fetch(guildId).catch(() => null));

		if (!guild) {
			logger.error(`Could not register dev commands, guild ${guildId} not found`);
			continue;
		}

		await syncCommands(guild.commands, devOnlyCommands, `dev (${guild.name})`);
	}
};

const sortNumbers = <T extends number>(values?: T[]) => values && [...values].sort((a, b) => a - b);

// Context menu commands export builders instead of plain JSON.
// Discord returns contexts and integration types sorted, while equals() compares arrays in order
const toJSON = (data: CommandData | { toJSON(): CommandData }): CommandData => {
	const json = "toJSON" in data ? data.toJSON() : data;

	return {
		...json,
		contexts: sortNumbers(json.contexts),
		// eslint-disable-next-line camelcase
		integration_types: sortNumbers(json.integration_types),
	};
};

const syncCommands = async (
	manager: ApplicationCommandManager | GuildApplicationCommandManager,
	commands: CommandFileObject[],
	scope: string,
) => {
	try {
		// Without localizations every localized command would always look changed
		const remote = await manager.fetch({ withLocalizations: true });
		const isGuild = manager instanceof GuildApplicationCommandManager;

		// Contexts and integration types only apply to global commands
		const local = commands.map(({ data }) => {
			const json = toJSON(data);
			if (!isGuild) return json;

			// eslint-disable-next-line camelcase, @typescript-eslint/no-unused-vars
			const { contexts, integration_types, ...rest } = json;

			return rest as CommandData;
		});

		const isSame = (
			a: { name: string; type?: ApplicationCommandType },
			b: { name: string; type?: ApplicationCommandType },
		) =>
			a.name === b.name &&
			(a.type ?? ApplicationCommandType.ChatInput) === (b.type ?? ApplicationCommandType.ChatInput);

		const isUpToDate = (cmd: CommandData) => {
			const existing = remote.find(r => isSame(r, cmd));
			if (!existing) return false;

			// equals() handles raw snake_case JSON at runtime, the typings just don't admit it
			if (!isGuild) return existing.equals(cmd as ApplicationCommandData, true);

			const comparable = {
				...cmd,
				contexts: existing.contexts ?? undefined,
				// eslint-disable-next-line camelcase
				integration_types: existing.integrationTypes ?? undefined,
			};

			return existing.equals(comparable as ApplicationCommandData, true);
		};

		const changed = local.filter(cmd => !isUpToDate(cmd)).map(cmd => cmd.name);
		const stale = remote.filter(r => !local.some(cmd => isSame(r, cmd))).map(r => r.name);

		if (!changed.length && !stale.length) {
			logger.info(`Commands (${scope}): ${local.length} up to date`);
			return;
		}

		await manager.set(local);

		logger.info(
			`Commands (${scope}): synced ${local.length}` +
				(changed.length ? `, changed: ${changed.join(", ")}` : "") +
				(stale.length ? `, removed: ${stale.join(", ")}` : ""),
		);
	} catch (error) {
		logger.error(`Failed to sync commands (${scope}):`, error);
	}
};
