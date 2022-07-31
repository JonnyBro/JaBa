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
				.addSubcommand(subcommand =>
					subcommand.setName("set")
						.setDescription(client.translate("owner/debug:SET"))
						.addStringOption(option =>
							option.setName("type")
								.setDescription(client.translate("owner/debug:TYPE"))
								.setRequired(true)
								.addChoices(
									{ name: client.translate("common:LEVEL"), value: "level" },
									{ name: client.translate("common:XP"), value: "xp" },
									{ name: client.translate("common:CREDITS"), value: "credits" },
									{ name: client.translate("economy/transactions:BANK"), value: "bank" },
									{ name: client.translate("common:REP"), value: "rep" },
								))
						.addUserOption(option =>
							option.setName("target")
								.setDescription(client.translate("owner/debug:TARGET"))
								.setRequired(true))
						.addIntegerOption(option =>
							option.setName("int")
								.setDescription(client.translate("owner/debug:INT"))
								.setRequired(true))
				)
				.addSubcommand(subcommand =>
					subcommand.setName("add")
						.setDescription(client.translate("owner/debug:ADD"))
						.addStringOption(option =>
							option.setName("type")
								.setDescription(client.translate("owner/debug:TYPE"))
								.setRequired(true)
								.addChoices(
									{ name: client.translate("common:LEVEL"), value: "level" },
									{ name: client.translate("common:XP"), value: "xp" },
									{ name: client.translate("common:CREDITS"), value: "credits" },
									{ name: client.translate("economy/transactions:BANK"), value: "bank" },
									{ name: client.translate("common:REP"), value: "rep" },
								))
						.addUserOption(option =>
							option.setName("target")
								.setDescription(client.translate("owner/debug:TARGET"))
								.setRequired(true))
						.addIntegerOption(option =>
							option.setName("int")
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
	 * @param {import("discord.js").CommandInteraction} interaction
	 * @param {Array} data
	 */
	async execute(client, interaction, data) {
		const action = interaction.options.getSubcommand();

		if (action === "set") {
			const type = interaction.options.getString("type");
			const member = interaction.options.getMember("target");
			const int = interaction.options.getInteger("int");
			if (member.user.bot) return interaction.error("owner/debug:BOT");

			switch (type) {
				case "level": {
					data.memberData.level = int;
					await data.memberData.save();
					return interaction.success("owner/debug:SUCCESS_" + type.toUpperCase(), {
						username: member.user.tag,
						amount: int
					}, { ephemeral: true });
				}

				case "xp": {
					data.memberData.exp = int;
					await data.memberData.save();
					return interaction.success("owner/debug:SUCCESS_" + type.toUpperCase(), {
						username: member.user.tag,
						amount: int
					}, { ephemeral: true });
				}

				case "credits": {
					data.memberData.money = int;
					await data.memberData.save();
					return interaction.success("owner/debug:SUCCESS_" + type.toUpperCase(), {
						username: member.user.tag,
						amount: int
					}, { ephemeral: true });
				}

				case "bank": {
					data.memberData.bankSold = int;
					await data.memberData.save();
					return interaction.success("owner/debug:SUCCESS_" + type.toUpperCase(), {
						username: member.user.tag,
						amount: int
					}, { ephemeral: true });
				}

				case "rep": {
					data.memberData.rep = int;
					await data.memberData.save();
					return interaction.success("owner/debug:SUCCESS_" + type.toUpperCase(), {
						username: member.user.tag,
						amount: int
					}, { ephemeral: true });
				}
			}
		} else {
			const type = interaction.options.getString("type");
			const member = interaction.options.getMember("target");
			const int = interaction.options.getInteger("int");
			if (member.user.bot) return interaction.error("owner/debug:BOT", { ephemeral: true });

			switch (type) {
				case "level": {
					data.memberData.level += int;
					await data.memberData.save();
					return interaction.success("owner/debug:SUCCESS_" + type.toUpperCase(), {
						username: member.user.tag,
						amount: int
					}, { ephemeral: true });
				}

				case "xp": {
					data.memberData.exp += int;
					await data.memberData.save();
					return interaction.success("owner/debug:SUCCESS_" + type.toUpperCase(), {
						username: member.user.tag,
						amount: int
					}, { ephemeral: true });
				}

				case "credits": {
					data.memberData.money += int;
					await data.memberData.save();
					return interaction.success("owner/debug:SUCCESS_" + type.toUpperCase(), {
						username: member.user.tag,
						amount: int
					}, { ephemeral: true });
				}

				case "bank": {
					data.memberData.bankSold += int;
					await data.memberData.save();
					return interaction.success("owner/debug:SUCCESS_" + type.toUpperCase(), {
						username: member.user.tag,
						amount: int
					}, { ephemeral: true });
				}

				case "rep": {
					data.memberData.rep += int;
					await data.memberData.save();
					return interaction.success("owner/debug:SUCCESS_" + type.toUpperCase(), {
						username: member.user.tag,
						amount: int
					}, { ephemeral: true });
				}
			}
		}
	}
}

module.exports = Debug;