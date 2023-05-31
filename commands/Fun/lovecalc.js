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
				.setDescriptionLocalizations({ "uk": client.translate("fun/lovecalc:DESCRIPTION", null, "uk-UA") })
				.setDMPermission(false)
				.addUserOption(option =>
					option.setName("first_member")
						.setDescription(client.translate("common:USER"))
						.setDescriptionLocalizations({ "uk": client.translate("common:USER", null, "uk-UA") })
						.setRequired(true))
				.addUserOption(option =>
					option.setName("second_member")
						.setDescription(client.translate("common:USER"))
						.setDescriptionLocalizations({ "uk": client.translate("common:USER", null, "uk-UA") })),
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
		const firstMember = interaction.options.getMember("first_member"),
			secondMember = interaction.options.getMember("second_member") || interaction.member;

		const members = [firstMember, secondMember].sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10)),
			hash = md5(`${members[0].id}${members[1].user.username}${members[0].user.username}${members[1].id}`);

		const string = hash
			.split("")
			.filter(e => !isNaN(e))
			.join("");
		const percent = parseInt(string.substr(0, 2), 10);

		const embed = new EmbedBuilder()
			.setAuthor({
				name: `❤️ ${interaction.translate("fun/lovecalc:DESCRIPTION")}`,
			})
			.setDescription(interaction.translate("fun/lovecalc:CONTENT", {
				percent,
				firstMember: firstMember.user.toString(),
				secondMember: secondMember.user.toString(),
			}))
			.setColor(client.config.embed.color)
			.setFooter({
				text: client.config.embed.footer,
			});

		interaction.reply({
			embeds: [embed],
		});
	}
}

module.exports = Lovecalc;