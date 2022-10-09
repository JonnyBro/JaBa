const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand"),
	fetch = require("node-fetch");

class Whois extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("whois")
				.setDescription(client.translate("general/whois:DESCRIPTION"))
				.addStringOption(option => option.setName("ip")
					.setDescription(client.translate("common:IP"))
					.setRequired(true)),
			aliases: [],
			dirname: __dirname,
			guildOnly: false,
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
		await interaction.deferReply();
		const ip = interaction.options.getString("ip");
		const whois = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,continent,continentCode,country,countryCode,region,regionName,city,zip,timezone,currency,isp,org,as,mobile,proxy,hosting,query`).then(response => response.json());
		if (whois.status === "fail") return interaction.editReply({ content: interaction.translate("general/whois:ERROR", { ip }) });
		const embed = new EmbedBuilder()
			.setTitle(interaction.translate("general/whois:INFO_ABOUT", {
				ip
			}))
			.setFooter({
				text: client.config.embed.footer
			})
			.setColor(client.config.embed.color)
			.addFields(
				{ name: interaction.translate("common:IP"), value: whois.query, inline: true },
				{ name: interaction.translate("general/whois:COUNTRY"), value: `${whois.country || interaction.translate("common:UNKNOWN")} (${whois.countryCode || interaction.translate("common:UNKNOWN")})`, inline: true },
				{ name: interaction.translate("general/whois:REGION"), value: `${whois.regionName || interaction.translate("common:UNKNOWN")} (${whois.region || interaction.translate("common:UNKNOWN")})`, inline: true },
				{ name: interaction.translate("general/whois:CITY"), value: `${whois.city || interaction.translate("common:UNKNOWN")}`, inline: true },
				{ name: interaction.translate("general/whois:ZIP"), value: `${whois.zip || interaction.translate("common:UNKNOWN")}`, inline: true },
				{ name: interaction.translate("general/whois:TIMEZONE"), value: `${whois.timezone || interaction.translate("common:UNKNOWN")}`, inline: true },
				{ name: interaction.translate("general/whois:CONTINENT"), value: `${whois.continent || interaction.translate("common:UNKNOWN")} (${whois.continentCode || interaction.translate("common:UNKNOWN")})`, inline: true },
				{ name: interaction.translate("general/whois:CURRENCY"), value: `${whois.currency || interaction.translate("common:UNKNOWN")}`, inline: true },
				{ name: interaction.translate("general/whois:ISP"), value: `${whois.isp || interaction.translate("common:UNKNOWN")}`, inline: true }
			)
			.setTimestamp();

		if (whois.proxy) embed.addFields({ name: interaction.translate("general/whois:INFO"), value: interaction.translate("general/whois:PROXY") });
		else if (whois.mobile) embed.addFields({ name: interaction.translate("general/whois:INFO"), value: interaction.translate("general/whois:MOBILE") });
		else if (whois.hosting) embed.addFields({ name: interaction.translate("general/whois:INFO"), value: interaction.translate("general/whois:HOSTING") });

		interaction.editReply({
			embeds: [embed]
		});
	}
}

module.exports = Whois;