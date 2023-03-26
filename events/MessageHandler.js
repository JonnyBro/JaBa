const { PermissionsBitField } = require("discord.js");
const BaseEvent = require("../base/BaseEvent"),
	xpCooldown = {},
	usersMap = new Map(),
	messageLimit = 10,
	timeDifferenceMs = 5000;

class MessageCreate extends BaseEvent {
	constructor() {
		super({
			name: "messageCreate",
			once: false,
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
				id: message.guild.id,
			});
			message.guild.data = data.guildData = guild;
		}
		if (message.content.match(new RegExp(`^<@!?${client.user.id}>( |)$`))) return message.replyT("misc:HELLO_SERVER", null, { mention: true });
		if (message.guild) {
			const memberData = await client.findOrCreateMember({
				id: message.author.id,
				guildId: message.guild.id,
			});
			data.memberData = memberData;
		}

		const userData = await client.findOrCreateUser({
			id: message.author.id,
		});
		data.userData = userData;

		if (message.guild) {
			await updateXp(client, message, data);

			if (data.guildData.plugins.automod.enabled && !data.guildData.plugins.automod.ignored.includes(message.channel.id))
				if (/(discord\.(gg|io|me|li)\/.+|discordapp\.com\/invite\/.+)/i.test(message.content))
					if (!message.channel.permissionsFor(message.member).has(PermissionsBitField.Flags.ManageMessages)) {
						message.delete();
						message.error("administration/automod:DELETED");
					}

			const afkReason = data.userData.afk;
			if (afkReason) {
				data.userData.afk = null;
				await data.userData.save();
				message.replyT("general/afk:DELETED", {
					user: message.author.username,
				}, { mention: true });
			}

			message.mentions.users.forEach(async (u) => {
				const userData = await client.findOrCreateUser({
					id: u.id,
				});
				if (userData.afk) message.replyT("general/afk:IS_AFK", { user: u.tag, reason: userData.afk }, { ephemeral: true });
			});
		}

		if (data.guildData.plugins.automod.enabled)
			if (usersMap.has(message.author.id)) {
				let msgCount = userData.msgCount;
				const userData = usersMap.get(message.author.id),
					{ lastMessage, timer } = userData,
					difference = message.createdTimestamp - lastMessage.createdTimestamp;

				if (difference > timeDifferenceMs) {
					clearTimeout(timer);

					userData.msgCount = 1;
					userData.lastMessage = message;
					userData.timer = setTimeout(() => {
						usersMap.delete(message.author.id);
					}, 1000);
					usersMap.set(message.author.id, userData);
				} else {
					++msgCount;
					if (parseInt(msgCount) === messageLimit) {
						message.replyT("administration/automod:");
						let messages = await message.channel.messages.fetch({
							limit: messageLimit,
						});
						messages = messages.filter(m => m.author.id === message.user.id);

						message.channel.bulkDelete(messages.filter(m => !m.pinned), true);
					} else {
						userData.msgCount = msgCount;
						usersMap.set(message.author.id, userData);
					}
				}
			} else {
				const fn = setTimeout(() => {
					usersMap.delete(message.author.id);
				}, 1000);

				usersMap.set(message.author.id, {
					msgCount: 1,
					lastMessage: message,
					timer: fn,
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

	if (isInCooldown)
		if (isInCooldown > Date.now()) return;

	const toWait = Date.now() + (60 * 1000); // 1 min
	xpCooldown[msg.author.id] = toWait;

	const won = client.functions.randomNum(1, 2);
	const newXp = parseInt(points + won, 10);
	const neededXp = 5 * (level * level) + 80 * level + 100;

	if (newXp > neededXp) {
		data.memberData.level = parseInt(level + 1, 10);
		data.memberData.exp = 0;
		msg.replyT("misc:LEVEL_UP", {
			level: data.memberData.level,
		}, { mention: false });
	} else data.memberData.exp = parseInt(newXp, 10);

	await data.memberData.save();
}

module.exports = MessageCreate;