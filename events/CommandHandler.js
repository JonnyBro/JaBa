const { InteractionType } = require("discord.js");
const BaseEvent = require("../base/BaseEvent");

class CommandHandler extends BaseEvent {
	constructor() {
		super({
			name: "interactionCreate",
			once: false,
		});
	}

	/**
	 *
	 * @param {import("../base/Client")} client
	 * @param {import("discord.js").CommandInteraction} interaction
	 */
	async execute(client, interaction) {
		const command = client.commands.get(interaction.commandName);

		const data = [];

		data.user = await client.getUserData(interaction.user.id);

		if (interaction.inGuild()) {
			data.guild = await client.getGuildData(interaction.guildId);
			data.member = await client.getMemberData(interaction.member.id, interaction.guildId);
		}

		interaction.data = data;

		if (interaction.isButton() && interaction.customId === "quote_delete" && interaction.message.deletable) return interaction.message.delete();
		if (interaction.isAutocomplete()) return await command.autocompleteRun(client, interaction);

		if (interaction.type !== InteractionType.ApplicationCommand && !interaction.isCommand()) return;

		if (command?.dirname.includes("IAT") && interaction.guildId !== "1039187019957555252") return interaction.reply({ content: "IAT Only", ephemeral: true });
		if (command.ownerOnly && interaction.user.id !== client.config.owner.id) return interaction.error("misc:OWNER_ONLY", null, { ephemeral: true });

		if (!interaction.data.user.achievements.firstCommand.achieved) {
			const args = {
				content: interaction.user.toString(),
				files: [
					{
						name: "achievement_unlocked2.png",
						attachment: "./assets/img/achievements/achievement_unlocked2.png",
					},
				],
			};

			interaction.data.user.achievements.firstCommand.progress.now = 1;
			interaction.data.user.achievements.firstCommand.achieved = true;

			await interaction.data.user.save();

			try {
				interaction.user.send(args);
			} catch (e) { /**/ }
		}

		client.logger.cmd(
			`[${interaction.guild ? interaction.guild.name : "DM"}]: [${interaction.user.getUsername()}] => /${command.command.name}${
				interaction.options.data.length > 0
					? ", args: " + interaction.options.data
						.map(arg => {
							return `${arg.name}: ${arg.value}`;
						}).join(", ")
					: ""
			}`,
		);

		return command.execute(client, interaction);
	}
}

module.exports = CommandHandler;
