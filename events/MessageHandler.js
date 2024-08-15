const { PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const BaseEvent = require("../base/BaseEvent");

const xpCooldown = {};

class MessageCreate extends BaseEvent {
	constructor() {
		super({
			name: "messageCreate",
			once: false,
		});
	}

	/**
	 *
	 * @param {import("../base/Client")} client
	 * @param {import("discord.js").Message} message
	 */
	async execute(client, message) {
		if (message.guild && message.guild.id === "568120814776614924") return;

		const data = [];

		if (message.author.bot) return;
		if (message.content.match(new RegExp(`^<@!?${client.user.id}>( |)$`))) return message.replyT("misc:HELLO_SERVER", null, { mention: true });

		data.user = await client.getUserData(message.author.id);

		if (message.guild) {
			if (!message.member) await message.guild.members.fetch(message.author.id);

			data.guild = await client.getGuildData(message.guildId);
			data.member = await client.getMemberData(message.author.id, message.guildId);
		}

		message.data = data;

		if (message.guild) {
			await updateXp(message);

			if (message.content.match(/(https|http):\/\/(ptb\.|canary\.)?(discord.com)\/(channels)\/\d+\/\d+\/\d+/g)) {
				const link = message.content.match(/(https|http):\/\/(ptb\.|canary\.)?(discord.com)\/(channels)\/\d+\/\d+\/\d+/g)[0],
					ids = link.match(/\d+/g),
					channelId = ids[1],
					messageId = ids[2];

				const msg = await message.guild.channels.cache.get(channelId).messages.fetch(messageId);
				const embed = client.embed({
					author: {
						name: message.translate("misc:QUOTE_TITLE", {
							user: msg.author.getUsername(),
						}),
						iconURL: "https://wynem.com/assets/images/icons/quote.webp",
					},
					thumbnail: msg.author.displayAvatarURL(),
					footer: {
						text: message.translate("misc:QUOTE_FOOTER", { user: message.author.getUsername() }),
					},
					timestamp: msg.createdTimestamp,
				});

				if (msg.content !== "") embed.addFields([
					{
						name: message.translate("misc:QUOTE_CONTENT"),
						value: msg.content,
					},
				]);

				if (msg.attachments.size > 0) {
					if (msg.attachments.find(a => a.contentType.includes("image/"))) embed.setImage(msg.attachments.find(a => a.contentType.includes("image/")).url);

					embed.addFields([
						{
							name: message.translate("misc:QUOTE_ATTACHED"),
							value: msg.attachments.map(a => { return `[${a.name}](${a.url})`; }).join(", "),
						},
					]);
				}

				const row = new ActionRowBuilder().addComponents(
					new ButtonBuilder().setLabel(message.translate("misc:QUOTE_JUMP")).setStyle(ButtonStyle.Link).setURL(msg.url),
					new ButtonBuilder().setCustomId("quote_delete").setEmoji("1273665480451948544").setStyle(ButtonStyle.Danger),
				);

				message.reply({
					embeds: [embed],
					components: [row],
				});
			}

			if (message.data.guild.plugins.automod.enabled && !message.data.guild.plugins.automod.ignored.includes(message.channelId))
				if (/(discord\.(gg|io|me|li)\/.+|discordapp\.com\/invite\/.+)/i.test(message.content))
					if (!message.channel.permissionsFor(message.member).has(PermissionsBitField.Flags.ManageMessages)) {
						await message.error("administration/automod:DELETED", null, { mention: true });
						message.delete();
					}

			if (message.data.user.afk) {
				message.data.user.afk = null;

				await message.data.user.save();

				message.replyT("general/afk:DELETED", {
					user: message.author.username,
				}, { mention: true });
			}

			message.mentions.users.forEach(async u => {
				const userData = await client.getUserData(u.id);

				if (userData.afk) message.replyT("general/afk:IS_AFK", { user: u.getUsername(), reason: userData.afk }, { ephemeral: true });
			});
		}

		return;
	}
}

/**
 *
 * @param {import("../base/Client")} client
 * @param {import("discord.js").Message} message
 * @returns
 */
async function updateXp(message) {
	const memberData = message.data.member,
		points = parseInt(memberData.exp),
		level = parseInt(memberData.level),
		isInCooldown = xpCooldown[message.author.id];

	if (isInCooldown) if (isInCooldown > Date.now()) return;

	const toWait = Date.now() + 60 * 1000; // 1 min
	xpCooldown[message.author.id] = toWait;

	const won = message.client.functions.randomNum(1, 2);
	const newXp = parseInt(points + won, 10);
	const neededXp = 5 * (level * level) + 80 * level + 100;

	if (newXp > neededXp) {
		memberData.level = parseInt(level + 1, 10);
		memberData.exp = 0;
		message.replyT("misc:LEVEL_UP", {
			level: memberData.level,
		}, { mention: false });
	} else memberData.exp = parseInt(newXp, 10);

	await memberData.save();
}

module.exports = MessageCreate;
