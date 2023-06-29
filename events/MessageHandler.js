const { PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
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
	 * @param {import("../base/JaBa")} client
	 * @param {import("discord.js").Message} message
	 */
	async execute(client, message) {
		if (message.guild && message.guild.id === "568120814776614924") return;

		const data = {};

		if (message.author.bot) return;
		if (message.content.match(new RegExp(`^<@!?${client.user.id}>( |)$`))) return message.replyT("misc:HELLO_SERVER", null, { mention: true });

		const userData = await client.findOrCreateUser({ id: message.author.id });
		data.userData = userData;

		if (message.guild && !message.member) await message.guild.members.fetch(message.author.id);
		if (message.guild) {
			const guildData = await client.findOrCreateGuild({ id: message.guild.id });
			const memberData = await client.findOrCreateMember({ id: message.author.id, guildId: message.guild.id });

			message.guild.data = data.guildData = guildData;
			data.memberData = memberData;
		}

		if (message.guild) {
			await updateXp(client, message, data.memberData);

			if (message.content.includes("discord.com/channels/")) {
				const link = message.content.match(/(https|http):\/\/(ptb\.|canary\.)?(discord.com)\/(channels)\/\d+\/\d+\/\d+/g)[0],
					ids = link.match(/\d+/g),
					channelId = ids[1],
					messageId = ids[2];

				const msg = await client.channels.cache.get(channelId).messages.fetch(messageId);
				const embed = new EmbedBuilder()
					.setAuthor({
						name: message.translate("misc:QUOTE_TITLE", {
							user: msg.author.discriminator === "0" ? msg.author.username : msg.author.tag,
						}),
						iconURL: "https://wynem.com/assets/images/icons/quote.webp",
					})
					.setThumbnail(msg.author.displayAvatarURL())
					.setDescription(msg.content !== "" ? msg.content : `*${message.translate("common:MISSING")}*`)
					.addFields([
						{
							name: message.translate("misc:QUOTE_ATTACHED"),
							value: msg.attachments.size > 0 ? msg.attachments.map(a => {
								return `[${a.name}](${a.url})`;
							}).join("\n") : `*${message.translate("common:MISSING")}*`,
						},
					])
					.setFooter({
						text: message.translate("misc:QUOTE_FOOTER", { user: message.author.discriminator === "0" ? message.author.username : message.author.tag }),
					})
					.setColor(client.config.embed.color)
					.setTimestamp(msg.createdTimestamp);

				const row = new ActionRowBuilder()
					.addComponents(
						new ButtonBuilder()
							.setLabel(message.translate("misc:QUOTE_JUMP"))
							.setStyle(ButtonStyle.Link)
							.setURL(msg.url),
						new ButtonBuilder()
							.setCustomId("quote_delete")
							.setEmoji("1102200816582000750")
							.setStyle(ButtonStyle.Danger),
					);

				const reply = await message.reply({
					embeds: [embed],
					components: [row],
				});

				const filter = i => i.user.id === message.author.id;
				const collector = message.channel.createMessageComponentCollector({ filter, time: (60 * 1000) });

				collector.on("collect", async i => {
					if (i.isButton() && i.customId === "quote_delete")
						if (reply.deletable) await reply.delete();
				});
			}

			if (data.guildData.plugins.automod.enabled && !data.guildData.plugins.automod.ignored.includes(message.channel.id))
				if (/(discord\.(gg|io|me|li)\/.+|discordapp\.com\/invite\/.+)/i.test(message.content))
					if (!message.channel.permissionsFor(message.member).has(PermissionsBitField.Flags.ManageMessages)) {
						await message.error("administration/automod:DELETED");
						message.delete();
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
				if (userData.afk) message.replyT("general/afk:IS_AFK", { user: u.discriminator === "0" ? u.username : u.tag, reason: userData.afk }, { ephemeral: true });
			});
		}

		return;
	}
}

/**
 *
 * @param {import("../base/JaBa")} client
 * @param {import("discord.js").Message} msg
 * @param {import("../base/Member")} memberData
 * @returns
 */
async function updateXp(client, msg, memberData) {
	const points = parseInt(memberData.exp),
		level = parseInt(memberData.level),
		isInCooldown = xpCooldown[msg.author.id];

	if (isInCooldown)
		if (isInCooldown > Date.now()) return;

	const toWait = Date.now() + (60 * 1000); // 1 min
	xpCooldown[msg.author.id] = toWait;

	const won = client.functions.randomNum(1, 2);
	const newXp = parseInt(points + won, 10);
	const neededXp = 5 * (level * level) + 80 * level + 100;

	if (newXp > neededXp) {
		memberData.level = parseInt(level + 1, 10);
		memberData.exp = 0;
		msg.replyT("misc:LEVEL_UP", {
			level: memberData.level,
		}, { mention: false });
	} else memberData.exp = parseInt(newXp, 10);

	await memberData.save();
}

module.exports = MessageCreate;