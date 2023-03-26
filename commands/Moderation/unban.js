const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Unban extends BaseCommand {
	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("unban")
				.setDescription(client.translate("moderation/unban:DESCRIPTION"))
				.setDescriptionLocalizations({ "uk": client.translate("moderation/unban:DESCRIPTION", null, "uk-UA") })
				.setDMPermission(false)
				.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers && PermissionFlagsBits.ManageMessages)
				.addStringOption(option => option.setName("user_id")
					.setDescription(client.translate("common:USER_ID"))
					.setDescriptionLocalizations({ "uk": client.translate("common:USER_ID", null, "uk-UA") })
					.setRequired(true)),
			aliases: [],
			dirname: __dirname,
			ownerOnly: false,
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
		const id = interaction.options.getString("user_id"),
			banned = await interaction.guild.bans.fetch();

		if (!banned.find(u => u.user.id === id)) return interaction.error("moderation/unban:NOT_BANNED", { id });

		await interaction.guild.bans.remove(id);

		interaction.success("moderation/unban:UNBANNED", {
			id,
		});
	}
}

module.exports = Unban;