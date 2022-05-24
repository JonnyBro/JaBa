const Command = require("../../base/Command"),
	Discord = require("discord.js"),
	gamedig = require("gamedig");

class Minecraft extends Command {
	constructor(client) {
		super(client, {
			name: "minecraft",
			dirname: __dirname,
			enabled: true,
			guildOnly: false,
			aliases: ["mc"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 1000
		});
	}

	async run(message, args, data) {
		const ip = args[0];
		if (!ip) return message.error("general/minecraft:MISSING_IP");

		const favicon = `https://eu.mc-api.net/v3/server/favicon/${ip}`;
		let options = {
			type: "minecraft",
			host: ip
		};

		if (ip.split(":").length > 1) {
			const ipp = ip.split(":");
			options = {
				type: "minecraft",
				host: ipp[0],
				port: ipp[1]
			};
		}

		const m = await message.sendT("misc:PLEASE_WAIT", null, {
			prefixEmoji: "loading"
		});

		let json = null;

		await gamedig.query(options).then((res) => {
			json = res;
		}).catch((err) => {
			console.error(err);
		});

		if (!json) {
			options.type = "minecraftpe";
			await gamedig.query(options).then((res) => {
				json = res;
			}).catch((err) => {
				console.error(err);
			});
		}

		if (!json) return m.error("general/minecraft:FAILED", null, { edit: true });

		const embed = new Discord.MessageEmbed()
			.setAuthor({
				name: json.name
			})
			.addField(message.translate("general/minecraft:FIELD_STATUS"), message.translate("general/minecraft:ONLINE"))
			.addField(message.translate("general/minecraft:FIELD_CONNECTED"), `**${(json.raw.players ? json.raw.players.online : json.players.length)}** ${message.getNoun((json.raw.players ? json.raw.players.online : json.players.length), message.translate("misc:NOUNS:PLAYERS:1"), message.translate("misc:NOUNS:PLAYERS:2"), message.translate("misc:NOUNS:PLAYERS:5"))} / **${(json.raw.players ? json.raw.players.max : json.maxplayers)}** ${message.getNoun((json.raw.players ? json.raw.players.max : json.maxplayers), message.translate("misc:NOUNS:PLAYERS:1"), message.translate("misc:NOUNS:PLAYERS:2"), message.translate("misc:NOUNS:PLAYERS:5"))}`)
			.addField(message.translate("general/minecraft:FIELD_IP"), json.connect, true)
			.addField(message.translate("general/minecraft:FIELD_VERSION"), json.raw.vanilla.raw.version.name, true)
			.addField(message.translate("general/minecraft:FIELD_PING"), json.raw.vanilla.ping.toString())
			.setColor(data.config.embed.color)
			.setThumbnail(favicon)
			.setFooter({
				text: data.config.embed.footer
			});

		m.edit({
			content: null,
			embeds: [embed]
		});
	}
}

module.exports = Minecraft;