const { ContextMenuCommandBuilder, ApplicationCommandType, InteractionContextType } = require("discord.js");
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
		const avatarURL = interaction.targetUser.displayAvatarURL({ size: 2048 });
		const embed = client.embed({ image: avatarURL });

		interaction.reply({
			embeds: [embed],
		});
	}
}

module.exports = AvatarContext;
