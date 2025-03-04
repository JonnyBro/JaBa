const { ContextMenuCommandBuilder, ApplicationCommandType, InteractionContextType, ApplicationIntegrationType } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class AvatarContext extends BaseCommand {
	/**
	 *
	 * @param {import("../../base/Client")} client
	 */
	constructor() {
		super({
			command: new ContextMenuCommandBuilder()
				.setName("Get Avatar")
				.setType(ApplicationCommandType.User)
				.setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
				.setContexts([InteractionContextType.BotDM, InteractionContextType.PrivateChannel, InteractionContextType.Guild]),
			dirname: __dirname,
			ownerOnly: false,
		});
	}

	/**
	 *
	 * @param {import("../../base/Client")} client
	 * @param {import("discord.js").UserContextMenuCommandInteraction} interaction
	 */
	async execute(client, interaction) {
		const avatarURL = interaction.guild ? interaction.targetMember.displayAvatarURL({ dynamic: true, extension: "png", size: 2048 }) : interaction.targetUser.avatarURL({ dynamic: true, extension: "png", size: 2048 });
		const embed = client.embed({ image: avatarURL });

		interaction.reply({
			embeds: [embed],
		});
	}
}

module.exports = AvatarContext;
