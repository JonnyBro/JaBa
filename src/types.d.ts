import {
	AutocompleteInteraction,
	CacheType,
	ChatInputCommandInteraction,
	ContextMenuCommandInteraction,
	Interaction,
	MessageContextMenuCommandInteraction,
	PermissionsString,
	RESTPostAPIApplicationCommandsJSONBody,
	UserContextMenuCommandInteraction,
} from "discord.js";
import { ExtendedClient } from "./structures/client.ts";
import { UserReminds } from "./models/UserModel.ts";

export type CommandData = RESTPostAPIApplicationCommandsJSONBody;

export type cacheRemindsData = {
	id: string;
	reminds: UserReminds[];
};

export type BuiltInValidationParams = {
	targetCommand: CommandFileObject;
	interaction: Interaction<CacheType>;
	client: ExtendedClient;
};

export type BuiltInValidation = ({}: BuiltInValidationParams) => boolean | void;

export type CronTaskData = {
	name: string;
	schedule: string;
	task: () => Promise<void> | void;
};

export interface CommandProps {
	interaction: ChatInputCommandInteraction | ContextMenuCommandInteraction | UserContextMenuCommandInteraction | MessageContextMenuCommandInteraction | AutocompleteInteraction;
	client: ExtendedClient;
}

export interface SlashCommandProps extends CommandProps {
	interaction: ChatInputCommandInteraction;
}

export interface CommandContext<_T extends Interaction, _Cached extends CacheType> {
	interaction: Interaction<CacheType>;
	client: ExtendedClient;
}

export interface CommandOptions {
	devOnly?: boolean;
	cooldown?: number;
}

export interface CommandFileObject {
	data: CommandData;
	options?: CommandOptions;
	run: <Cached extends CacheType = CacheType>(_ctx: CommandContext<Interaction, Cached>) => Awaited<void>;
	autocompleteRun?: <Cached extends CacheType = CacheType>(_ctx: CommandContext<Interaction, Cached>) => Awaited<void>;
}
