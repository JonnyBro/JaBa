const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Set extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("set")
				.setDescription(client.translate("administration/set:DESCRIPTION"))
				.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
				.addStringOption(option => option.setName("type")
					.setDescription(client.translate("owner/debug:TYPE"))
					.setRequired(true)
					.addChoices(
						{ name: client.translate("common:LEVEL"), value: "level" },
						{ name: client.translate("common:XP"), value: "xp" },
						{ name: client.translate("common:CREDITS"), value: "credits" },
						{ name: client.translate("economy/transactions:BANK"), value: "bank" }
					))
				.addUserOption(option => option.setName("user")
					.setDescription(client.translate("common:USER"))
					.setRequired(true))
				.addIntegerOption(option => option.setName("int")
					.setDescription(client.translate("common:INT"))
					.setRequired(true)),
			aliases: [],
			dirname: __dirname,
			guildOnly: true,
			ownerOnly: false
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
		const type = interaction.options.getString("type");
		const member = interaction.options.getMember("user");
		if (member.user.bot) return interaction.error("misc:BOT_USER", null, { ephemeral: true });

		const memberData = await client.findOrCreateMember({
			id: member.id,
			guildId: interaction.guildId
		});
		const int = interaction.options.getInteger("int");
		if (int < 0) return interaction.error("administration/set:INVALID_NUMBER", null, { ephemeral: true });

		switch (type) {
			case "level": {
				memberData.level = int;
				await memberData.save();
				return interaction.success(`owner/debug:SUCCESS_${type.toUpperCase()}`, {
					username: member.toString(),
					amount: int
				}, { ephemeral: true });
			}

			case "xp": {
				memberData.exp = int;
				await memberData.save();
				return interaction.success(`owner/debug:SUCCESS_${type.toUpperCase()}`, {
					username: member.toString(),
					amount: int
				}, { ephemeral: true });
			}

			case "credits": {
				memberData.money = int;
				await memberData.save();
				return interaction.success(`owner/debug:SUCCESS_${type.toUpperCase()}`, {
					username: member.toString(),
					amount: int
				}, { ephemeral: true });
			}

			case "bank": {
				memberData.bankSold = int;
				await memberData.save();
				return interaction.success(`owner/debug:SUCCESS_${type.toUpperCase()}`, {
					username: member.toString(),
					amount: int
				}, { ephemeral: true });
			}
		}
	}
}

module.exports = Set;