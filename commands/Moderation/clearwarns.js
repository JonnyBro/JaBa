const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Clearwarns extends BaseCommand {
	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("clearwarns")
				.setDescription(client.translate("moderation/clearwarns:DESCRIPTION"))
				.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers && PermissionFlagsBits.ManageMessages)
				.addUserOption(option => option.setName("user")
					.setDescription(client.translate("common:USER"))
					.setRequired(true)),
			aliases: [],
			dirname: __dirname,
			guildOnly: true
		});
	}
	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 */
	async onLoad() {
		//...
	}
	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 * @param {Object} data
	 */
	async execute(client, interaction) {
		const member = interaction.options.getMember("user");

		const memberData = await client.findOrCreateMember({
			id: member.id,
			guildID: interaction.guildId
		});

		memberData.sanctions = [];
		memberData.save();
		interaction.success("moderation/clearwarns:SUCCESS", {
			username: member.user.tag
		});
	}
}

module.exports = Clearwarns;