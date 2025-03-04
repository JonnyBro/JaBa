const { SlashCommandBuilder, InteractionContextType, ApplicationIntegrationType } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand"),
	fetch = require("node-fetch");

class Whois extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("whois")
				.setDescription(client.translate("general/whois:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("general/whois:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("general/whois:DESCRIPTION", null, "ru-RU"),
				})
				.setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
				.setContexts([InteractionContextType.BotDM, InteractionContextType.PrivateChannel, InteractionContextType.Guild])
				.addStringOption(option =>
					option
						.setName("ip")
						.setDescription(client.translate("common:IP"))
						.setDescriptionLocalizations({
							uk: client.translate("common:IP", null, "uk-UA"),
							ru: client.translate("common:IP", null, "ru-RU"),
						})
						.setRequired(true),
				)
				.addBooleanOption(option =>
					option
						.setName("ephemeral")
						.setDescription(client.translate("misc:EPHEMERAL_RESPONSE"))
						.setDescriptionLocalizations({
							uk: client.translate("misc:EPHEMERAL_RESPONSE", null, "uk-UA"),
							ru: client.translate("misc:EPHEMERAL_RESPONSE", null, "ru-RU"),
						}),
				),
			dirname: __dirname,
			ownerOnly: false,
		});
	}

	/**
	 *
	 * @param {import("../../base/Client")} client
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 */
	async execute(client, interaction) {
		await interaction.deferReply({ ephemeral: interaction.options.getBoolean("ephemeral") || false });

		const ip = interaction.options.getString("ip"),
			whois = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,continent,continentCode,country,countryCode,region,regionName,city,zip,timezone,currency,isp,org,as,mobile,proxy,hosting,query`).then(response => response.json());

		if (whois.status === "fail") return interaction.error("general/whois:ERROR", { ip }, { edit: true });

		const embed = client.embed({
			title: interaction.translate("general/whois:INFO_ABOUT", {
				ip,
			}),
			fields: [
				{ name: interaction.translate("common:IP"), value: whois.query, inline: true },
				{ name: interaction.translate("general/whois:COUNTRY"), value: `${whois.country || interaction.translate("common:UNKNOWN")} (${whois.countryCode || interaction.translate("common:UNKNOWN")})`, inline: true },
				{ name: interaction.translate("general/whois:REGION"), value: `${whois.regionName || interaction.translate("common:UNKNOWN")} (${whois.region || interaction.translate("common:UNKNOWN")})`, inline: true },
				{ name: interaction.translate("general/whois:CITY"), value: `${whois.city || interaction.translate("common:UNKNOWN")}`, inline: true },
				{ name: interaction.translate("general/whois:ZIP"), value: `${whois.zip || interaction.translate("common:UNKNOWN")}`, inline: true },
				{ name: interaction.translate("general/whois:TIMEZONE"), value: `${whois.timezone || interaction.translate("common:UNKNOWN")}`, inline: true },
				{ name: interaction.translate("general/whois:CONTINENT"), value: `${whois.continent || interaction.translate("common:UNKNOWN")} (${whois.continentCode || interaction.translate("common:UNKNOWN")})`, inline: true },
				{ name: interaction.translate("general/whois:CURRENCY"), value: `${whois.currency || interaction.translate("common:UNKNOWN")}`, inline: true },
				{ name: interaction.translate("general/whois:ISP"), value: `${whois.isp || interaction.translate("common:UNKNOWN")}`, inline: true },
			],
		});

		if (whois.proxy) embed.data.fields.push({ name: interaction.translate("general/whois:INFO"), value: interaction.translate("general/whois:PROXY") });
		if (whois.mobile) embed.data.fields.push({ name: interaction.translate("general/whois:INFO"), value: interaction.translate("general/whois:MOBILE") });
		if (whois.hosting) embed.data.fields.push({ name: interaction.translate("general/whois:INFO"), value: interaction.translate("general/whois:HOSTING") });

		interaction.editReply({
			embeds: [embed],
		});
	}
}

module.exports = Whois;
