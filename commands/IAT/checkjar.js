const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand"),
	fetch = require("node-fetch"),
	moment = require("moment");

class Checkjar extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("checkjar")
				.setDescription(client.translate("iat/checkjar:DESCRIPTION"))
				.setDMPermission(false),
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
		if (!interaction.member.roles.cache.has("1039467712633638962")) return interaction.reply({ content: "error", ephemeral: true });

		await interaction.deferReply();

		const jar = client.config.monobankApi.jar;
		const data = await fetch(`https://api.monobank.ua/personal/statement/${jar}/${Date.now() - (7 * 24 * 60 * 60 * 1000)}/${Date.now()}`, {
			method: "GET",
			headers: {
				"X-Token": client.config.monobankApi.token,
			},
		}).then(res => res.json());

		const embed = new EmbedBuilder()
			.setColor(client.config.embed.color)
			.setFooter({
				text: client.config.embed.footer,
			})
			.setAuthor({
				name: "Monobank API",
				iconURL: "https://api.monobank.ua/docs/logo.png",
			})
			.setDescription(`Текущий баланс: **${data[0].balance / Math.pow(10, 2)}** грн\nТребуется на след. месяц: **654,46** грн (по курсу евро на 24.01.2023)`);

		data.length = 10;

		data.forEach(t => {
			const time = moment.unix(t.time);

			embed.addFields([
				{
					name: `${t.description}`,
					value: `Дата: ${time.locale("uk-UA").format("DD MMMM YYYY, HH:mm")}\nСумма: ${t.amount / Math.pow(10, 2)} грн`,
					inline: true,
				},
			]);
		});

		interaction.editReply({
			embeds: [embed],
		});
	}
}

module.exports = Checkjar;