const { SlashCommandBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand"),
	fetch = require("node-fetch"),
	moment = require("moment");

class Checkjar extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("checkjar")
				.setDescription(client.translate("iat/checkjar:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("iat/checkjar:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("iat/checkjar:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(false),
			dirname: __dirname,
			ownerOnly: false,
		});
	}

	/**
	 *
	 * @param {import("../../base/Client")} client
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 * @param {Object} data
	 */
	async execute(client, interaction) {
		await interaction.deferReply();

		const clientInfo = await fetch("https://api.monobank.ua/personal/client-info", {
			method: "GET",
			headers: {
				"X-Token": client.config.apiKeys.monobank.key,
				"Content-Type": "application/json",
			},
		}).then(res => res.json());
		const jar = clientInfo.jars.find(j => j.id === client.config.apiKeys.monobank.jar);
		const jarTransactions = await fetch(`https://api.monobank.ua/personal/statement/${jar.id}/${Date.now() - 7 * 24 * 60 * 60 * 1000}/${Date.now()}`, {
			method: "GET",
			headers: {
				"X-Token": client.config.apiKeys.monobank.key,
				"Content-Type": "application/json",
			},
		}).then(res => res.json());

		const embed = client.embed({
			description: `Текущий баланс: **${jar.balance / Math.pow(10, 2)}** грн\nТребуется на след. месяц: **379,18** грн (по курсу евро на 02.07.2023).\nЗдесь указаны последние 10 транзакций.`,
		});

		jarTransactions.length = 10;

		jarTransactions.forEach(t => {
			// TODO
			const time = moment.unix(t.time);

			embed.data.fields.push([
				{
					name: `${t.description}`,
					value: `Дата: <t:${time}:D>\nСумма: ${t.amount / Math.pow(10, 2)} грн`,
				},
			]);
		});

		interaction.editReply({
			embeds: [embed],
		});
	}
}

module.exports = Checkjar;
