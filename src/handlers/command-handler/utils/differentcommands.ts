import { ApplicationCommand, RESTPostAPIApplicationCommandsJSONBody } from "discord.js";

export default function differentCommands(
	appCommand: ApplicationCommand,
	localCommand: RESTPostAPIApplicationCommandsJSONBody,
) {
	const appName = appCommand.name || "";
	const localName = localCommand.name || "";
	const appContexts = localCommand.contexts || [];
	const localContexts = localCommand.contexts || [];
	const appIntTypes = localCommand.integration_types || [];
	const localIntTypes = localCommand.integration_types || [];
	const appOptions = appCommand?.options || [];
	const localOptions = localCommand?.options || [];

	if (appName !== localName) return true;
	if (appContexts !== localContexts) return true;
	if (appIntTypes !== localIntTypes) return true;
	if (appOptions.length !== localOptions.length) return true;

	return false;
}
