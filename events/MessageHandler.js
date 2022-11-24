const { PermissionsBitField } = require("discord.js");
const BaseEvent = require("../base/BaseEvent"),
	xpCooldown = {};

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
		if (message.author.bot) return;
		if (message.guild && !message.member) await message.guild.members.fetch(message.author.id);
		if (message.guild) {
			const guild = await client.findOrCreateGuild({
				id: message.guild.id
			});
			message.guild.data = data.guildData = guild;
		}
		if (message.content.match(new RegExp(`^<@!?${client.user.id}>( |)$`))) return message.replyT("misc:HELLO_SERVER", null, { mention: true });
		if (message.guild) {
			const memberData = await client.findOrCreateMember({
				id: message.author.id,
				guildId: message.guild.id
			});
			data.memberData = memberData;
		}

		const userData = await client.findOrCreateUser({
			id: message.author.id
		});
		data.userData = userData;

		if (message.guild) {
			await updateXp(client, message, data);

			if (data.guildData.plugins.automod.enabled && !data.guildData.plugins.automod.ignored.includes(message.channel.id)) {
				if (/(discord\.(gg|io|me|li)\/.+|discordapp\.com\/invite\/.+)/i.test(message.content)) {
					if (!message.channel.permissionsFor(message.member).has(PermissionsBitField.Flags.ManageMessages)) {
						message.delete();
						return message.error("administration/automod:DELETED");
					}
				}
			}

			const afkReason = data.userData.afk;
			if (afkReason) {
				data.userData.afk = null;
				await data.userData.save();
				message.replyT("general/afk:DELETED", {
					username: message.author.username
				}, { mention: true });
			}

			message.mentions.users.forEach(async (u) => {
				const userData = await client.findOrCreateUser({
					id: u.id
				});
				if (userData.afk) message.error("general/afk:IS_AFK", { user: u.tag, reason: userData.afk });
			});
		}
		return;
	}
}

/**
 *
 * @param {import("../base/JaBa")} client
 * @param {import("discord.js").Message} msg
 * @param {*} data
 * @returns
 */
async function updateXp(client, msg, data) {
	const points = parseInt(data.memberData.exp),
		level = parseInt(data.memberData.level),
		isInCooldown = xpCooldown[msg.author.id];

	if (isInCooldown) {
		if (isInCooldown > Date.now()) return;
	}

	const toWait = Date.now() + (60 * 1000); // 1 min
	xpCooldown[msg.author.id] = toWait;

	const won = client.functions.randomNum(1, 2);
	const newXp = parseInt(points + won, 10);
	const neededXp = 5 * (level * level) + 80 * level + 100;

	if (newXp > neededXp) {
		data.memberData.level = parseInt(level + 1, 10);
		data.memberData.exp = 0;
		msg.replyT("misc:LEVEL_UP", {
			level: data.memberData.level
		}, { mention: false });
	} else data.memberData.exp = parseInt(newXp, 10);

	await data.memberData.save();
}

module.exports = MessageCreate;