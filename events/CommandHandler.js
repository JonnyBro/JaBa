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
	 * @param {import("../base/JaBa")} client
	 * @param {import("discord.js").Interaction} interaction
	 */
	async execute(client, interaction) {
		const command = client.commands.get(interaction.commandName);
		const data = [];

		const userData = await client.findOrCreateUser({
			id: interaction.user.id,
		});
		data.userData = userData;

		if (interaction.inGuild()) {
			const guildData = await client.findOrCreateGuild({
				id: interaction.guildId,
			});
			interaction.guild.data = data.guildData = guildData;

			const memberData = await client.findOrCreateMember({
				id: interaction.member.id,
				guildId: interaction.guildId,
			});
			data.memberData = memberData;
		}

		if (interaction.isAutocomplete()) {
			return await command.autocompleteRun(client, interaction);
		}
		if (interaction.type !== InteractionType.ApplicationCommand && !interaction.isCommand()) return;

		if (command.guildOnly && !interaction.inGuild()) return interaction.error("misc:GUILD_ONLY", null, { ephemeral: true });
		if (command.ownerOnly && interaction.user.id !== client.config.owner.id) return interaction.error("misc:OWNER_ONLY", null, { ephemeral: true });

		if (!userData.achievements.firstCommand.achieved) {
			const args = {
				content: interaction.user.toString(),
				files: [{
					name: "achievement_unlocked2.png",
					attachment: "./assets/img/achievements/achievement_unlocked2.png",
				}],
			};

			userData.achievements.firstCommand.progress.now = 1;
			userData.achievements.firstCommand.achieved = true;
			userData.markModified("achievements.firstCommand");
			await userData.save();

			interaction.channel.isDMBased() ? interaction.user.send(args) : await interaction.channel.send(args);
		}

		client.logger.log(`User ${interaction.user.tag} used ${command.command.name} in ${interaction.guild ? interaction.guild.name : "DM"} with arguments: ${interaction.options.data.length > 0 ? interaction.options.data.map(arg => { return `${arg.name}: ${arg.value}`; }).join(", ") : "no args"}`, "cmd");

		return command.execute(client, interaction, data);
	}
}

module.exports = CommandHandler;