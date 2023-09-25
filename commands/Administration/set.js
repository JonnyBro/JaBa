const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");
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
				.setDescriptionLocalizations({
					uk: client.translate("administration/set:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("administration/set:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(false)
				.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
				.addStringOption(option =>
					option
						.setName("type")
						.setDescription(client.translate("owner/debug:TYPE"))
						.setDescriptionLocalizations({
							uk: client.translate("owner/debug:TYPE", null, "uk-UA"),
							ru: client.translate("owner/debug:TYPE", null, "ru-RU"),
						})
						.setRequired(true)
						.setChoices(
							{ name: client.translate("common:LEVEL"), value: "level" },
							{ name: client.translate("common:XP"), value: "xp" },
							{ name: client.translate("common:CREDITS"), value: "credits" },
							{ name: client.translate("economy/transactions:BANK"), value: "bank" },
						),
				)
				.addUserOption(option =>
					option
						.setName("user")
						.setDescription(client.translate("common:USER"))
						.setDescriptionLocalizations({
							uk: client.translate("common:USER", null, "uk-UA"),
							ru: client.translate("common:USER", null, "ru-RU"),
						})
						.setRequired(true),
				)
				.addIntegerOption(option =>
					option
						.setName("int")
						.setDescription(client.translate("common:INT"))
						.setDescriptionLocalizations({
							uk: client.translate("common:INT", null, "uk-UA"),
							ru: client.translate("common:INT", null, "ru-RU"),
						})
						.setRequired(true),
				),
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
		const type = interaction.options.getString("type"),
			member = interaction.options.getMember("user");
		if (member.user.bot) return interaction.error("misc:BOT_USER", null, { ephemeral: true });

		const memberData = await client.findOrCreateMember({
			id: member.id,
			guildId: interaction.guildId,
		});

		const int = interaction.options.getInteger("int");
		if (int < 0) return interaction.error("administration/set:INVALID_NUMBER", null, { ephemeral: true });

		switch (type) {
			case "level": {
				memberData.level = int;

				memberData.markModified("level");
				await memberData.save();

				return interaction.success(`owner/debug:SUCCESS_${type.toUpperCase()}`, {
					user: member.toString(),
					amount: int,
				}, { ephemeral: true });
			}

			case "xp": {
				memberData.exp = int;

				memberData.markModified("exp");
				await memberData.save();

				return interaction.success(`owner/debug:SUCCESS_${type.toUpperCase()}`, {
					user: member.toString(),
					amount: int,
				}, { ephemeral: true });
			}

			case "credits": {
				memberData.money = int;

				memberData.markModified("money");
				await memberData.save();

				return interaction.success(`owner/debug:SUCCESS_${type.toUpperCase()}`, {
					user: member.toString(),
					amount: int,
				}, { ephemeral: true });
			}

			case "bank": {
				memberData.bankSold = int;

				memberData.markModified("bankSold");
				await memberData.save();

				return interaction.success(`owner/debug:SUCCESS_${type.toUpperCase()}`, {
					user: member.toString(),
					amount: int,
				}, { ephemeral: true });
			}
		}
	}
}

module.exports = Set;
