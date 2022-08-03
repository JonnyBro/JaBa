const { PermissionsBitField } = require("discord.js"),
	xpCooldown = {},
	BaseEvent = require("../base/BaseEvent");

class MessageCreate extends BaseEvent {
	constructor() {
		super({
			name: "messageCreate",
			once: false
		});
	}

	/**
	 *
	 * @param {import("../base/JaBa")} client
	 * @param {import("discord.js").Message} message
	 */
	async execute(client, message) {
		if (message.guild && message.guild.id === "568120814776614924") return;
		if (message.content.includes("no bitches")) message.reply({ files: [{ name: "b.png", attachment: "./assets/img/b.png" }] });
		if (message.content.includes("bitches") && !message.content.includes("no bitches")) message.reply({ files: [{ name: "nob.png", attachment: "./assets/img/nob.png" }] });

		const data = {};
		data.config = client.config;

		if (message.author.bot) return;

		if (message.guild && !message.member) await message.guild.members.fetch(message.author.id);

		if (message.guild) {
			const guild = await client.findOrCreateGuild({
				id: message.guild.id
			});
			message.guild.data = data.guild = guild;
		}

		if (message.content.match(new RegExp(`^<@!?${client.user.id}>( |)$`))) return message.replyT("misc:HELLO_SERVER", { username: message.author.username });

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

			if (data.guild.plugins.automod.enabled && !data.guild.plugins.automod.ignored.includes(message.channel.id)) {
				if (/(discord\.(gg|io|me|li)\/.+|discordapp\.com\/invite\/.+)/i.test(message.content)) {
					if (!message.channel.permissionsFor(message.member).has(PermissionsBitField.Flags.ManageMessages)) {
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
				message.replyT("general/setafk:DELETED", {
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
		return;
	}
}

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

module.exports = MessageCreate;