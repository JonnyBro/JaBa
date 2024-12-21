export default function differentCommands(appCommand, localCommand) {
	const appOptions = appCommand.options || [];
	const localOptions = localCommand.options || [];
	const appDescription = appCommand.description || "";
	const localDescription = localCommand.description || "";

	return localDescription !== appDescription || localOptions.length !== appOptions.length;
}
