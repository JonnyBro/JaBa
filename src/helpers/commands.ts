import { CommandFileObject } from "@/types.js";
import { ApplicationCommandType } from "discord.js";
import { basename } from "node:path";

export const getCategoryFromPath = (filepath: string) => {
	const segments = filepath.split(/[\\/]/);
	const commandsIndex = segments.lastIndexOf("commands");

	return segments[commandsIndex + 1].toLowerCase() || "uncategorized";
};

export const getCommandType = (cmd: CommandFileObject) =>
	(cmd.data as { type?: ApplicationCommandType }).type ?? ApplicationCommandType.ChatInput;

export const isContextCommand = (cmd: CommandFileObject) => getCommandType(cmd) !== ApplicationCommandType.ChatInput;

// Context menu commands keep their strings next to the slash command they belong to: playcontext.ts -> music/play
export const getLocaleNamespace = (cmd: CommandFileObject) => {
	const category = getCategoryFromPath(cmd.filePath);
	if (!isContextCommand(cmd)) return `${category}/${cmd.data.name.toLowerCase()}`;

	return `${category}/${basename(cmd.filePath)
		.replace(/\.[jt]s$/, "")
		.replace(/context$/, "")}`;
};

export const getDescriptionKey = (cmd: CommandFileObject) =>
	`${getLocaleNamespace(cmd)}:${isContextCommand(cmd) ? "CONTEXT_DESCRIPTION" : "DESCRIPTION"}`;
