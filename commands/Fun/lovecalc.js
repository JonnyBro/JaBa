const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand"),
	md5 = require("md5");

class Lovecalc extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("lovecalc")
				.setDescription(client.translate("fun/lovecalc:DESCRIPTION"))
				.addUserOption(option =>
					option.setName("first_member")
						.setDescription(client.translate("common:USER"))
						.setRequired(true))
				.addUserOption(option =>
					option.setName("second_member")
						.setDescription(client.translate("common:USER"))),
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
	 * @param {Array} data
	 */
	async execute(client, interaction) {
		const firstMember = interaction.options.getMember("first_member");
		const secondMember = interaction.options.getMember("second_member") || interaction.user;

		const members = [firstMember, secondMember].sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10));
		const hash = md5(`${members[0].id}${members[1].user.username}${members[0].user.username}${members[1].id}`);

		const string = hash
			.split("")
			.filter(e => !isNaN(e))
			.join("");
		const percent = parseInt(string.substr(0, 2), 10);

		const embed = new EmbedBuilder()
			.setAuthor({
				name: `❤️ ${interaction.translate("fun/lovecalc:DESCRIPTION")}`
			})
			.setDescription(interaction.translate("fun/lovecalc:CONTENT", {
				percent,
				firstMember: firstMember,
				secondMember: secondMember
			}))
			.setColor(client.config.embed.color)
			.setFooter({
				text: client.config.embed.footer
			});

		interaction.reply({
			embeds: [embed]
		});
	}
}

module.exports = Lovecalc;