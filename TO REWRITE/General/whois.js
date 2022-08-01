const Command = require("../../base/Command"),
	Discord = require("discord.js"),
	fetch = require("node-fetch");

class Whois extends Command {
	constructor(client) {
		super(client, {
			name: "whois",
			dirname: __dirname,
			enabled: true,
			guildOnly: false,
			aliases: ["ip"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 1000
		});
	}

	async run(message, args, data) {
		if (!args[0]) return message.error("general/whois:NO_IP");

		const whois = await fetch(`http://ip-api.com/json/${args[0]}?fields=status,message,continent,continentCode,country,countryCode,region,regionName,city,zip,timezone,currency,isp,org,as,mobile,proxy,hosting,query`).then(response => response.json());

		if (whois.status === "fail") {
			const embed = new Discord.EmbedBuilder()
				.setDescription(whois.message)
				.setTitle(message.translate("general/whois:ERROR", {
					ip: args[0]
				}))
				.setColor(data.config.embed.color)
				.setFooter({
					text: data.config.embed.footer
				})
				.setTimestamp();
			return message.reply({
				embeds: [embed]
			});
		}

		const embed = new Discord.EmbedBuilder()
			.setTitle(message.translate("general/whois:INFO_ABOUT", {
				ip: args[0]
			}))
			.setFooter({
				text: data.config.embed.footer
			})
			.setColor(data.config.embed.color)
			.addFields(
				{ name: "IP", value: whois.query, inline: true },
				{ name: message.translate("general/whois:COUNTRY"), value: `${whois.country || message.translate("common:UNKNOWN")} (${whois.countryCode || message.translate("common:UNKNOWN")})`, inline: true },
				{ name: message.translate("general/whois:REGION"), value: `${whois.regionName || message.translate("common:UNKNOWN")} (${whois.region || message.translate("common:UNKNOWN")})`, inline: true },
				{ name: message.translate("general/whois:CITY"), value: `${whois.city || message.translate("common:UNKNOWN")}`, inline: true },
				{ name: message.translate("general/whois:ZIP"), value: `${whois.zip || message.translate("common:UNKNOWN")}`, inline: true },
				{ name: message.translate("general/whois:TIMEZONE"), value: `${whois.timezone || message.translate("common:UNKNOWN")}`, inline: true },
				{ name: message.translate("general/whois:CONTINENT"), value: `${whois.continent || message.translate("common:UNKNOWN")} (${whois.continentCode || message.translate("common:UNKNOWN")})`, inline: true },
				{ name: message.translate("general/whois:CURRENCY"), value: `${whois.currency || message.translate("common:UNKNOWN")}`, inline: true },
				{ name: message.translate("general/whois:ISP"), value: `${whois.isp || message.translate("common:UNKNOWN")}`, inline: true }
			)
			.setTimestamp();

		if (whois.proxy == true) embed.addFields({ name: message.translate("general/whois:INFO"), value: message.translate("general/whois:PROXY") });
		else if (whois.mobile == true) embed.addFields({ name: message.translate("general/whois:INFO"), value: message.translate("general/whois:MOBILE") });
		else if (whois.hosting == true) embed.addFields({ name: message.translate("general/whois:INFO"), value: message.translate("general/whois:HOSTING") });

		message.reply({
			embeds: [embed]
		});
	}
}

module.exports = Whois;