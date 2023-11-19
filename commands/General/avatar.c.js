const { ContextMenuCommandBuilder, ApplicationCommandType } = require("discord.js");
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
				.setDMPermission(false),
			aliases: [],
			dirname: __dirname,
			ownerOnly: false,
		});
	}
	/**
	 *
	 * @param {import("../../base/Client")} client
	 */
	async onLoad() {
		//...
	}
	/**
	 *
	 * @param {import("../../base/Client")} client
	 * @param {import("discord.js").UserContextMenuCommandInteraction} interaction
	 * @param {Object} data
	 */
	async execute(client, interaction) {
		const avatar = interaction.targetUser.avatarURL({ size: 2048 });

		interaction.reply({
			files: [
				{
					attachment: avatar,
				},
			],
		});
	}
}

module.exports = AvatarContext;
