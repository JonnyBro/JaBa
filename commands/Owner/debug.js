const { SlashCommandBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Debug extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("debug")
				.setDescription(client.translate("owner/debug:DESCRIPTION"))
				.addSubcommand(subcommand => subcommand.setName("set")
					.setDescription(client.translate("owner/debug:SET"))
					.addStringOption(option => option.setName("type")
						.setDescription(client.translate("owner/debug:TYPE"))
						.setRequired(true)
						.addChoices(
							{ name: client.translate("common:LEVEL"), value: "level" },
							{ name: client.translate("common:XP"), value: "xp" },
							{ name: client.translate("common:CREDITS"), value: "credits" },
							{ name: client.translate("economy/transactions:BANK"), value: "bank" },
							{ name: client.translate("common:REP"), value: "rep" },
						))
					.addUserOption(option => option.setName("user")
						.setDescription(client.translate("common:USER"))
						.setRequired(true))
					.addIntegerOption(option => option.setName("int")
						.setDescription(client.translate("common:INT"))
						.setRequired(true))
				)
				.addSubcommand(subcommand => subcommand.setName("add")
					.setDescription(client.translate("owner/debug:ADD"))
					.addStringOption(option => option.setName("type")
						.setDescription(client.translate("owner/debug:TYPE"))
						.setRequired(true)
						.addChoices(
							{ name: client.translate("common:LEVEL"), value: "level" },
							{ name: client.translate("common:XP"), value: "xp" },
							{ name: client.translate("common:CREDITS"), value: "credits" },
							{ name: client.translate("economy/transactions:BANK"), value: "bank" },
							{ name: client.translate("common:REP"), value: "rep" },
						))
					.addUserOption(option => option.setName("user")
						.setDescription(client.translate("common:USER"))
						.setRequired(true))
					.addIntegerOption(option => option.setName("int")
						.setDescription(client.translate("owner/debug:INT"))
						.setRequired(true))
				),
			aliases: [],
			dirname: __dirname,
			guildOnly: true,
			ownerOnly: true
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
	 * @param {Array} data
	 */
	async execute(client, interaction, data) {
		const command = interaction.options.getSubcommand();

		if (command === "set") {
			const type = interaction.options.getString("type");
			const member = interaction.options.getMember("user");
			if (member.user.bot) return interaction.error("misc:BOT_USER", null, { ephemeral: true });
			const int = interaction.options.getInteger("int");

			switch (type) {
				case "level": {
					data.memberData.level = int;
					await data.memberData.save();
					return interaction.success("owner/debug:SUCCESS_" + type.toUpperCase(), {
						username: member.toString(),
						amount: int
					}, { ephemeral: true });
				}

				case "xp": {
					data.memberData.exp = int;
					await data.memberData.save();
					return interaction.success("owner/debug:SUCCESS_" + type.toUpperCase(), {
						username: member.toString(),
						amount: int
					}, { ephemeral: true });
				}

				case "credits": {
					data.memberData.money = int;
					await data.memberData.save();
					return interaction.success("owner/debug:SUCCESS_" + type.toUpperCase(), {
						username: member.toString(),
						amount: int
					}, { ephemeral: true });
				}

				case "bank": {
					data.memberData.bankSold = int;
					await data.memberData.save();
					return interaction.success("owner/debug:SUCCESS_" + type.toUpperCase(), {
						username: member.toString(),
						amount: int
					}, { ephemeral: true });
				}

				case "rep": {
					data.memberData.rep = int;
					await data.memberData.save();
					return interaction.success("owner/debug:SUCCESS_" + type.toUpperCase(), {
						username: member.toString(),
						amount: int
					}, { ephemeral: true });
				}
			}
		} else {
			const type = interaction.options.getString("type");
			const member = interaction.options.getMember("target");
			if (member.user.bot) return interaction.error("misc:BOT_USER", null, { ephemeral: true });
			const int = interaction.options.getInteger("int");

			switch (type) {
				case "level": {
					data.memberData.level += int;
					await data.memberData.save();
					return interaction.success("owner/debug:SUCCESS_" + type.toUpperCase(), {
						username: member.toString(),
						amount: int
					}, { ephemeral: true });
				}

				case "xp": {
					data.memberData.exp += int;
					await data.memberData.save();
					return interaction.success("owner/debug:SUCCESS_" + type.toUpperCase(), {
						username: member.toString(),
						amount: int
					}, { ephemeral: true });
				}

				case "credits": {
					data.memberData.money += int;
					await data.memberData.save();
					return interaction.success("owner/debug:SUCCESS_" + type.toUpperCase(), {
						username: member.toString(),
						amount: int
					}, { ephemeral: true });
				}

				case "bank": {
					data.memberData.bankSold += int;
					await data.memberData.save();
					return interaction.success("owner/debug:SUCCESS_" + type.toUpperCase(), {
						username: member.toString(),
						amount: int
					}, { ephemeral: true });
				}

				case "rep": {
					data.memberData.rep += int;
					await data.memberData.save();
					return interaction.success("owner/debug:SUCCESS_" + type.toUpperCase(), {
						username: member.toString(),
						amount: int
					}, { ephemeral: true });
				}
			}
		}
	}
}

module.exports = Debug;