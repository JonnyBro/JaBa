import { InteractionType } from "discord.js";
import BaseEvent from "../base/BaseEvent";

class CommandHandler extends BaseEvent {
	constructor() {
		super({
			name: "interactionCreate",
			once: false,
		});
	}

	/**
	 * Handles command interaction events.
	 * @param {import("../base/Client")} client
	 * @param {import("discord.js").CommandInteraction} interaction
	 */
	async execute(client, interaction) {
		if (interaction.isButton() && interaction.customId === "quote_delete" && interaction.message.deletable) return interaction.message.delete();

		const command = client.commands.get(interaction.commandName);
		if (!command) return;

		const data = { user: await client.getUserData(interaction.user.id) };

		if (interaction.inGuild()) {
			data.guild = await client.getGuildData(interaction.guildId);
			data.member = await client.getMemberData(interaction.member.id, interaction.guildId);
		}

		interaction.data = data;

		if (interaction.isAutocomplete()) return await command.autocompleteRun(client, interaction);
		if (interaction.type !== InteractionType.ApplicationCommand || !interaction.isCommand()) return;

		// IAT Guild Command Check
		if (command?.dirname.includes("IAT") && interaction.guildId !== "1039187019957555252") return interaction.reply({ content: "IAT only", ephemeral: true });

		// Owner-only command check
		if (command.ownerOnly && interaction.user.id !== client.config.owner.id) return interaction.error("misc:OWNER_ONLY", null, { ephemeral: true });

		// First command achievement check
		const { firstCommand } = interaction.data.user.achievements;
		if (!firstCommand.achieved) {
			firstCommand.progress.now = 1;
			firstCommand.achieved = true;

			await interaction.data.user.save();

			const message = {
				content: interaction.user.toString(),
				files: [{ name: "achievement_unlocked2.png", attachment: "./assets/img/achievements/achievement_unlocked2.png" }],
			};

			try {
				await interaction.user.send(message);
			} catch (e) {
				client.logger.warn("Failed to send achievement message to user:", e);
			}
		}

		// Command logging
		const args = interaction.options.data.map(arg => `${arg.name}: ${arg.value}`).join(", ");
		client.logger.cmd(`[${interaction.guild ? interaction.guild.name : "DM/Private Channel"}]: [${interaction.user.tag}] => /${command.command.name}${args ? `, args: [${args}]` : ""}`);

		return command.execute(client, interaction);
	}
}

export default CommandHandler;
