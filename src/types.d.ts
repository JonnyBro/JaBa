import {
	AutocompleteInteraction,
	CacheType,
	ChatInputCommandInteraction,
	ContextMenuCommandInteraction,
	Interaction,
	Message,
	MessageContextMenuCommandInteraction,
	RESTPostAPIApplicationCommandsJSONBody,
	UserContextMenuCommandInteraction,
} from "discord.js";
import { UserReminds } from "./models/UserModel.ts";
import { ExtendedClient } from "./structures/client.ts";
import { RainlinkPlayer } from "rainlink";

export interface RainlinkPlayerCustom extends RainlinkPlayer {
	message: Message | null;
}

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
	interaction:
		| ChatInputCommandInteraction
		| ContextMenuCommandInteraction
		| UserContextMenuCommandInteraction
		| MessageContextMenuCommandInteraction
		| AutocompleteInteraction;
	client: ExtendedClient;
}

export interface SlashCommandProps extends CommandProps {
	interaction: ChatInputCommandInteraction;
}

export interface UserContextCommandProps extends CommandProps {
	interaction: UserContextMenuCommandInteraction;
}

export interface MessageContextCommandProps extends CommandProps {
	interaction: MessageContextMenuCommandInteraction;
}

export interface AutocompleteProps extends CommandProps {
	interaction: AutocompleteInteraction;
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
	run: <Cached extends CacheType = CacheType>(
		_ctx: CommandContext<Interaction, Cached>,
	) => Awaited<void>;
	autocompleteRun?: <Cached extends CacheType = CacheType>(
		_ctx: CommandContext<Interaction, Cached>,
	) => Awaited<void>;
	filePath: string;
}
