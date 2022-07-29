const Command = require("../../base/Command"),
	Discord = require("discord.js"),
	backup = require("discord-backup");

backup.setStorageFolder(__dirname + "/../../backups");

class Backup extends Command {
	constructor(client) {
		super(client, {
			name: "backup",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ["ba"],
			memberPermissions: ["MANAGE_GUILD"],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS", "ADMINISTRATOR"],
			nsfw: false,
			ownerOnly: false,
			cooldown: 20000
		});
	}

	async run(message, args, data) {
		const status = args[0];
		if (!status) return message.error("administration/backup:MISSING_STATUS");

		if (status === "create") {
			const m = await message.sendT("misc:PLEASE_WAIT", null, {
				prefixEmoji: "loading"
			});
			backup.create(message.guild).then((backup) => {
				m.delete();

				message.success("administration/backup:SUCCESS_PUBLIC");
				message.author.send(message.translate("administration/backup:SUCCESS_PRIVATE", {
					backupID: backup.id
				})).catch(() => {
					backup.remove(backup.id);
					message.error("misc:CANNOT_DM");
				});
			}).catch((err) => {
				console.error(err);
				return message.error("misc:ERR_OCCURRED");
			});
		} else if (status === "load") {
			const backupID = args[1];
			if (!backupID) return message.error("administration/backup:MISSING_BACKUP_ID");

			backup.fetch(backupID).then(async () => {
				message.sendT("administration/backup:CONFIRMATION");

				const filter = m => m.author.id === message.author.id;
				const collector = message.channel.createMessageCollector({
					filter,
					time: 20000
				});

				collector.on("collect", async msg => {
					if (msg.content.toLowerCase() === message.translate("common:YES").toLowerCase()) {
						message.author.send(message.translate("administration/backup:START_LOADING"));

						backup.load(backupID, message.guild).then(() => {
							backup.remove(backupID);
							message.author.send(message.translate("administration/backup:LOAD_SUCCESS"));
							collector.stop();
						}).catch((err) => {
							console.error(err);
							return message.error("misc:ERR_OCCURRED");
						});
					}
				});

				collector.on("end", (_, reason) => {
					if (reason === "time") return message.error("misc:TIMES_UP");
				});
			}).catch((err) => {
				console.error(err);
				return message.error("administration/backup:NO_BACKUP_FOUND", {
					backupID
				});
			});
		} else if (status === "info") {
			const backupID = args[1];
			if (!backupID) return message.error("administration/backup:MISSING_BACKUP_ID");

			backup.fetch(backupID).then(async (backupInfo) => {
				const embed = new Discord.MessageEmbed()
					.setAuthor({
						name: message.translate("administration/backup:TITLE_INFO")
					})
					.addField(message.translate("administration/backup:TITLE_ID"), backupInfo.id, true)
					.addField(message.translate("administration/backup:TITLE_SERVER_ID"), backupInfo.data.guildID.toString(), true)
					.addField(message.translate("administration/backup:TITLE_SIZE"), `${backupInfo.size} kb`, true)
					.addField(message.translate("administration/backup:TITLE_CREATED_AT"), this.client.printDate(new Date(backupInfo.data.createdTimestamp)), true)
					.setColor(data.config.embed.color)
					.setFooter({
						text: data.config.embed.footer
					});
				message.reply({
					embeds: [embed]
				});
			}).catch((err) => {
				console.error(err);
				return message.error("administration/backup:NO_BACKUP_FOUND", {
					backupID
				});
			});
		} else if (status === "remove") {
			const backupID = args[1];
			if (!backupID) return message.error("administration/backup:MISSING_BACKUP_ID");

			backup.fetch(backupID).then(async () => {
				message.sendT("administration/backup:REMOVE_CONFIRMATION");

				const filter = m => m.author.id === message.author.id;
				const collector = message.channel.createMessageCollector({
					filter,
					time: 20000
				});

				collector.on("collect", async msg => {
					if (msg.content.toLowerCase() === message.translate("common:YES").toLowerCase()) {
						backup.remove(backupID).then(async () => {
							message.success("administration/backup:SUCCESS_REMOVED");
						});
						collector.stop();
					}
				});

				collector.on("end", (_, reason) => {
					if (reason === "time") return message.error("misc:TIMES_UP");
				});
			}).catch((err) => {
				console.error(err);
				return message.error("administration/backup:NO_BACKUP_FOUND", {
					backupID
				});
			});
		} else {
			return message.error("administration/backup:MISSING_STATUS");
		}
	}
}

module.exports = Backup;