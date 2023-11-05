const { SlashCommandBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Debug extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("debug")
				.setDescription(client.translate("owner/debug:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("owner/debug:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("owner/debug:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(false)
				.addSubcommand(subcommand =>
					subcommand
						.setName("set")
						.setDescription(client.translate("owner/debug:SET"))
						.setDescriptionLocalizations({
							uk: client.translate("owner/debug:SET", null, "uk-UA"),
							ru: client.translate("owner/debug:SET", null, "ru-RU"),
						})
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
									{ name: client.translate("common:REP"), value: "rep" },
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
				)
				.addSubcommand(subcommand =>
					subcommand
						.setName("add")
						.setDescription(client.translate("owner/debug:ADD"))
						.setDescriptionLocalizations({
							uk: client.translate("owner/debug:ADD", null, "uk-UA"),
							ru: client.translate("owner/debug:ADD", null, "ru-RU"),
						})
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
									{ name: client.translate("common:REP"), value: "rep" },
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
				),
			aliases: [],
			dirname: __dirname,
			ownerOnly: true,
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
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 * @param {Array} data
	 */
	async execute(client, interaction) {
		const command = interaction.options.getSubcommand();

		if (command === "set") {
			const type = interaction.options.getString("type"),
				int = interaction.options.getInteger("int");

			const member = interaction.options.getMember("user");
			if (member.user.bot) return interaction.error("misc:BOT_USER", null, { ephemeral: true });

			const userData = await client.findOrCreateUser(member.id),
				memberData = await client.findOrCreateMember({
					id: member.id,
					guildId: interaction.guildId,
				});

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

				case "rep": {
					userData.rep = int;

					userData.markModified("rep");
					await userData.save();

					return interaction.success(`owner/debug:SUCCESS_${type.toUpperCase()}`, {
						user: member.toString(),
						amount: int,
					}, { ephemeral: true });
				}
			}
		} else {
			const type = interaction.options.getString("type"),
				int = interaction.options.getInteger("int");

			const member = interaction.options.getMember("target");
			if (member.user.bot) return interaction.error("misc:BOT_USER", null, { ephemeral: true });

			const userData = await client.findOrCreateUser(member.id),
				memberData = await client.findOrCreateMember({
					id: member.id,
					guildId: interaction.guildId,
				});

			switch (type) {
				case "level": {
					memberData.level += int;

					memberData.markModified("level");
					await memberData.save();

					return interaction.success(`owner/debug:SUCCESS_${type.toUpperCase()}`, {
						user: member.toString(),
						amount: int,
					}, { ephemeral: true });
				}

				case "xp": {
					memberData.exp += int;

					memberData.markModified("exp");
					await memberData.save();

					return interaction.success(`owner/debug:SUCCESS_${type.toUpperCase()}`, {
						user: member.toString(),
						amount: int,
					}, { ephemeral: true });
				}

				case "credits": {
					memberData.money += int;

					memberData.markModified("money");
					await memberData.save();

					return interaction.success(`owner/debug:SUCCESS_${type.toUpperCase()}`, {
						user: member.toString(),
						amount: int,
					}, { ephemeral: true });
				}

				case "bank": {
					memberData.bankSold += int;

					memberData.markModified("bankSold");
					await memberData.save();

					return interaction.success(`owner/debug:SUCCESS_${type.toUpperCase()}`, {
						user: member.toString(),
						amount: int,
					}, { ephemeral: true });
				}

				case "rep": {
					userData.rep += int;

					userData.markModified("rep");
					await userData.save();

					return interaction.success(`owner/debug:SUCCESS_${type.toUpperCase()}`, {
						user: member.toString(),
						amount: int,
					}, { ephemeral: true });
				}
			}
		}
	}
}

module.exports = Debug;
