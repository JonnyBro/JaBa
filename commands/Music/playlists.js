const Command = require("../../base/Command"),
	Discord = require("discord.js");

class Playlists extends Command {
	constructor(client) {
		super(client, {
			name: "playlists",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["pls"],
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 3000
		});
	}

	async run(message, args, data) {
		const playlists = data.userData.playlists;

		if (args[0]) {
			const name = args.join(" ");
			let playlist;

			for (const pl of playlists) {
				if (!pl.name === name) return message.error("music/removeplaylist:NOT_FOUND", {
					name
				});

				playlist = pl;
			}

			const embed = new Discord.MessageEmbed()
				.setAuthor({
					name: message.translate("music/playlists:EMBED_TITLE2", {
						name
					}),
					iconURL: message.author.displayAvatarURL({
						size: 512,
						dynamic: true,
						format: "png"
					})
				})
				.setColor(data.config.embed.color)
				.setFooter({
					text: data.config.embed.footer
				})
				.addField(message.translate("music/playlists:NAME"), playlist.name, true)
				.addField(message.translate("music/playlists:COUNT"), playlist.songs.length.toString(), true);

			const songs = [];
			for (const song of playlist.songs) {
				songs.push(`[${song.name}](${song.url})`);
			}

			embed.addField(message.translate("music/playlists:SONGS"), songs.join("\n"));

			return message.reply({
				embeds: [embed]
			});
		}

		const embed = new Discord.MessageEmbed()
			.setAuthor({
				name: message.translate("music/playlists:EMBED_TITLE"),
				iconURL: message.author.displayAvatarURL({
					size: 512,
					dynamic: true,
					format: "png"
				})
			})
			.setColor(data.config.embed.color)
			.setFooter({
				text: data.config.embed.footer
			});

		const pls = [];
		playlists.forEach((pl) => {
			pls.push(`${message.translate("music/playlists:NAME")}: ${pl.name}\n${message.translate("music/playlists:COUNT")}: ${pl.songs.length}\n`);
		});

		if (playlists.length < 1) {
			embed.setDescription(message.translate("music/playlists:NO_PLAYLISTS"));
		} else {
			embed.addField(message.translate("music/playlists:PLAYLISTS"), pls.join("\n"), true);
		}

		message.reply({
			embeds: [embed]
		});
	}
}

module.exports = Playlists;