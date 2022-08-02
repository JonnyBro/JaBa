const BaseEvent = require("../base/BaseEvent");
const { InteractionType } = require("discord.js");

class CommandHandler extends BaseEvent {
	constructor() {
		super({
			name: "interactionCreate",
			once: false
		});
	}

	/**
	 *
	 * @param {import("../base/JaBa")} client
	 * @param {import("discord.js").Interaction} interaction
	 */
	async execute(client, interaction) {
		if (interaction.type !== InteractionType.ApplicationCommand && !interaction.isCommand()) return;

		const command = client.commands.get(interaction.commandName);
		const data = [];

		const userData = await client.findOrCreateUser({
			id: interaction.member.id
		});
		data.userData = userData;

		if (command.guildOnly && !interaction.inGuild()) return interaction.replyT("misc:GUILD_ONLY", { ephemeral: true });
		if (command.ownerOnly && interaction.member.id !== client.config.owner.id) return interaction.replyT("misc:OWNER_ONLY", { ephemeral: true });

		if (interaction.inGuild()) {
			const guildData = await client.findOrCreateGuild({
				id: interaction.guildId
			});
			interaction.guild.data = data.guildData = guildData;

			const memberData = await client.findOrCreateMember({
				id: interaction.member.id,
				guildID: interaction.guildId
			});
			data.memberData = memberData;
		}

		if (!userData.achievements.firstCommand.achieved) {
			userData.achievements.firstCommand.progress.now = 1;
			userData.achievements.firstCommand.achieved = true;
			userData.markModified("achievements.firstCommand");
			await userData.save();
			await interaction.channel.send({
				files: [{
					name: "achievement_unlocked2.png",
					attachment: "./assets/img/achievements/achievement_unlocked2.png"
				}]
			});
		}

		return command.execute(client, interaction, data);
	}
}

module.exports = CommandHandler;