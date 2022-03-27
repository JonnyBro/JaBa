const { Permissions } = require("discord.js"),
	xpCooldown = {},
	cmdCooldown = {};

module.exports = class {
	constructor(client) {
		this.client = client;
	}

	async run(message) {
		if (message.guild && message.guild.id === "568120814776614924") return;

		const data = {};

		if (message.author.bot) return;

		if (message.guild && !message.member) await message.guild.members.fetch(message.author.id);

		const client = this.client;
		data.config = client.config;

		if (message.guild) {
			const guild = await client.findOrCreateGuild({
				id: message.guild.id
			});
			message.guild.data = data.guild = guild;
		}

		if (message.content.match(new RegExp(`^<@!?${client.user.id}>( |)$`))) {
			if (message.guild) return message.sendT("misc:HELLO_SERVER", { username: message.author.username, prefix: data.guild.prefix });
			else return message.sendT("misc:HELLO_DM");
		}

		if (message.content.includes("@someone") && message.guild && client.commands.get("someone").conf.enabled) return client.commands.get("someone").run(message, null, data);

		if (message.guild) {
			const memberData = await client.findOrCreateMember({
				id: message.author.id,
				guildID: message.guild.id
			});
			data.memberData = memberData;
		}

		const userData = await client.findOrCreateUser({
			id: message.author.id
		});
		data.userData = userData;

		if (message.guild) {
			await updateXp(client, message, data);

			if (!message.channel.permissionsFor(message.member).has(Permissions.FLAGS.MANAGE_MESSAGES) && !message.editedAt) {
				const channelSlowmode = data.guild.slowmode.channels.find((ch) => ch.id === message.channel.id);
				if (channelSlowmode) {
					const uSlowmode = data.guild.slowmode.users.find((d) => d.id === (message.author.id + message.channel.id));
					if (uSlowmode) {
						if (uSlowmode.time > Date.now()) {
							message.delete();
							return message.author.send(message.translate("administration/slowmode:PLEASE_WAIT", {
								time: message.convertTime(uSlowmode.time, "to", true),
								channel: message.channel.toString()
							}));
						} else {
							uSlowmode.time = channelSlowmode.time + Date.now();
						}
					} else {
						data.guild.slowmode.users.push({
							id: message.author.id + message.channel.id,
							time: channelSlowmode.time + Date.now()
						});
					}
					data.guild.markModified("slowmode.users");
					await data.guild.save();
				}
			}

			if (data.guild.plugins.automod.enabled && !data.guild.plugins.automod.ignored.includes(message.channel.id)) {
				if (/(discord\.(gg|io|me|li)\/.+|discordapp\.com\/invite\/.+)/i.test(message.content)) {
					if (!message.channel.permissionsFor(message.member).has(Permissions.FLAGS.MANAGE_MESSAGES)) {
						message.delete();
						message.author.send("```" + message.content + "```");
						return message.error("administration/automod:DELETED", {
							username: message.author.tag
						});
					}
				}
			}

			const afkReason = data.userData.afk;
			if (afkReason) {
				data.userData.afk = null;
				await data.userData.save();
				message.sendT("general/setafk:DELETED", {
					username: message.author.username
				});
			}

			message.mentions.users.forEach(async (u) => {
				const userData = await client.findOrCreateUser({
					id: u.id
				});
				if (userData.afk) message.error("general/setafk:IS_AFK", { user: u.tag, reason: userData.afk });
			});
		}

		const prefix = client.functions.getPrefix(message, data);
		if (!prefix) return;

		const args = message.content.slice((typeof prefix === "string" ? prefix.length : 0)).trim().split(/ +/g);
		const command = args.shift().toLowerCase();
		const cmd = client.commands.get(command) || client.commands.get(client.aliases.get(command));

		const customCommand = message.guild ? data.guild.customCommands.find((c) => c.name === command) : null;
		const customCommandAnswer = customCommand ? customCommand.answer : "";

		if (!cmd && !customCommandAnswer && message.guild) return;
		else if (!cmd && !customCommandAnswer && !message.guild) return message.sendT("misc:HELLO_DM");

		if (message.guild && data.guild.ignoredChannels.includes(message.channel.id) && !message.member.permissions.has(Permissions.FLAGS.MANAGE_MESSAGES)) {
			message.delete();
			return message.author.send(message.translate("misc:RESTRICTED_CHANNEL", {
				channel: message.channel.toString()
			}));
		}

		if (customCommandAnswer) return message.channel.send({ content: customCommandAnswer });
		if (cmd.conf.guildOnly && !message.guild) return message.error("misc:GUILD_ONLY");

		if (message.guild) {
			let neededPermissions = [];
			if (!cmd.conf.botPermissions.includes("EMBED_LINKS")) cmd.conf.botPermissions.push("EMBED_LINKS");

			cmd.conf.botPermissions.forEach((perm) => {
				if (!message.channel.permissionsFor(message.guild.me).has(perm)) neededPermissions.push(perm);
			});

			if (neededPermissions.length > 0) return message.error("misc:MISSING_BOT_PERMS", { list: neededPermissions.map((p) => `\`${p}\``).join(", ") });

			neededPermissions = [];
			cmd.conf.memberPermissions.forEach((perm) => {
				if (!message.channel.permissionsFor(message.member).has(perm)) neededPermissions.push(perm);
			});

			if (neededPermissions.length > 0) return message.error("misc:MISSING_MEMBER_PERMS", { list: neededPermissions.map((p) => `\`${message.translate(`misc:PERMISSIONS:${p}`)}\``).join(", ") });
			if (!message.channel.permissionsFor(message.member).has(Permissions.FLAGS.MENTION_EVERYONE) && (message.content.includes("@everyone") || message.content.includes("@here"))) return message.error("misc:EVERYONE_MENTION");
			if (!message.channel.nsfw && cmd.conf.nsfw) return message.error("misc:NSFW_COMMAND");
		}

		if (!cmd.conf.enabled) return message.error("misc:COMMAND_DISABLED");
		if (cmd.conf.ownerOnly && message.author.id !== client.config.owner.id) return message.error("misc:OWNER_ONLY");

		let uCooldown = cmdCooldown[message.author.id];
		if (!uCooldown) {
			cmdCooldown[message.author.id] = {};
			uCooldown = cmdCooldown[message.author.id];
		}

		const time = uCooldown[cmd.help.name] || 0;
		if (time && (time > Date.now())) {
			const seconds = Math.ceil((time - Date.now()) / 1000);
			return message.error("misc:COOLDOWNED", { seconds: `${seconds} ${client.getNoun(seconds, message.translate("misc:NOUNS:SECONDS:1"), message.translate("misc:NOUNS:SECONDS:2"), message.translate("misc:NOUNS:SECONDS:5"))}` });
		}

		cmdCooldown[message.author.id][cmd.help.name] = Date.now() + cmd.conf.cooldown;

		client.logger.log(`${message.author.username} (${message.author.id}) ran command ${cmd.help.name} ${message.guild ? `on ${message.guild.name}` : "in DM"}`, "cmd");

		const log = new this.client.logs({
			commandName: cmd.help.name,
			author: {
				username: message.author.username,
				discriminator: message.author.discriminator,
				id: message.author.id
			},
			guild: {
				name: message.guild ? message.guild.name : "dm",
				id: message.guild ? message.guild.id : "dm"
			}
		});
		log.save();

		if (!data.userData.achievements.firstCommand.achieved) {
			data.userData.achievements.firstCommand.progress.now = 1;
			data.userData.achievements.firstCommand.achieved = true;
			data.userData.markModified("achievements.firstCommand");
			await data.userData.save();
			await message.channel.send({
				files: [{
					name: "achievement_unlocked2.png",
					attachment: "./assets/img/achievements/achievement_unlocked2.png"
				}]
			});
		}

		try {
			cmd.run(message, args, data);
			if (cmd.help.category === "Moderation" && data.guild.autoDeleteModCommands) {
				setTimeout(() => {
					if (message.deletable) message.delete();
				}, 3000);
			}
		} catch (e) {
			console.error(e);
			return message.error("misc:ERR_OCCURRED");
		}
	}
};

async function updateXp(client, msg, data) {
	const points = parseInt(data.memberData.exp);
	const level = parseInt(data.memberData.level);
	const isInCooldown = xpCooldown[msg.author.id];
	if (isInCooldown) {
		if (isInCooldown > Date.now()) return;
	}

	const toWait = Date.now() + 60000; // 1 min
	xpCooldown[msg.author.id] = toWait;

	const won = client.functions.randomNum(1, 4);
	const newXp = parseInt(points + won, 10);
	const neededXp = 5 * (level * level) + 80 * level + 100;

	if (newXp > neededXp) data.memberData.level = parseInt(level + 1, 10);

	data.memberData.exp = parseInt(newXp, 10);
	await data.memberData.save();
}