export default async function registerCommands(props) {
	const globalCommands = props.commands.filter(cmd => !cmd.options?.devOnly);
	await registerGlobalCommands(props.client, globalCommands);
}

const registerGlobalCommands = async (client, commands) => {
	const appCommandsManager = client.application.commands;
	await appCommandsManager.fetch();

	const newCommands = commands.filter(cmd => !appCommandsManager.cache.some(existingCmd => existingCmd.name === cmd.data.name));

	await Promise.all(
		newCommands.map(data =>
			appCommandsManager.create(data).catch(() => {
				throw new Error(`Failed to register command: ${data.name}`);
			}),
		),
	);
};
