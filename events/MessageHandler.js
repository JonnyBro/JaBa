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
		if (message.author.bot) return;
		if (message.content.match(new RegExp(`^<@!?${client.user.id}>( |)$`))) return message.replyT("misc:HELLO_SERVER", null, { mention: true });

		const data = await this.initializeMessageData(client, message);
		message.data = data;

		if (message.guild)
			await this.handleGuildMessage(client, message);

		return;
	}

	async initializeMessageData(client, message) {
		const data = { user: await client.getUserData(message.author.id) };

		if (message.guild) {
			if (!message.member) await message.guild.members.fetch(message.author.id);

			data.guild = await client.getGuildData(message.guildId);
			data.member = await client.getMemberData(message.author.id, message.guildId);
		}

		return data;
	}

	async handleGuildMessage(client, message) {
		await updateXp(message);

		if (this.isLinkQuote(message)) await this.handleLinkQuote(client, message);
		if (message.data.guild.plugins.automod.enabled && !message.data.guild.plugins.automod.ignored.includes(message.channelId)) await this.checkAutomod(message);

		await this.checkAfkStatus(client, message);
		await this.checkMentionedUsersAfk(client, message);
	}

	isLinkQuote(message) {
		return /(https?:\/\/(ptb\.|canary\.)?(discord\.com)\/channels\/\d+\/\d+)/g.test(message.content);
	}

	async handleLinkQuote(client, message) {
		const link = message.content.match(/(https?:\/\/(ptb\.|canary\.)?(discord\.com)\/channels\/\d+\/\d+)/g)[0];
		const ids = link.match(/\d+/g);
		const channelId = ids[1];
		const messageId = ids[2];

		try {
			const msg = await message.guild.channels.cache.get(channelId).messages.fetch(messageId);
			const embed = this.createQuoteEmbed(client, msg, message);
			const row = new ActionRowBuilder().addComponents(
				new ButtonBuilder().setLabel("Jump").setStyle(ButtonStyle.Link).setURL(msg.url),
				new ButtonBuilder().setCustomId("quote_delete").setEmoji("1273665480451948544").setStyle(ButtonStyle.Danger),
			);

			await message.reply({ embeds: [embed], components: [row] });
		} catch (error) {
			client.logger.error("Failed to fetch quoted message:", error);
		}
	}

	createQuoteEmbed(client, msg, message) {
		const embed = client.embed({
			author: {
				name: message.translate("misc:QUOTE_TITLE", { user: msg.author.getUsername() }),
				iconURL: "https://wynem.com/assets/images/icons/quote.webp",
			},
			thumbnail: msg.author.displayAvatarURL(),
			footer: message.translate("misc:QUOTE_FOOTER"),
			timestamp: msg.createdTimestamp,
		});

		if (msg.content) embed.addFields([{ name: message.translate("misc:QUOTE_CONTENT"), value: msg.content }]);
		if (msg.attachments.size > 0) {
			const images = msg.attachments.filter(a => a.contentType.includes("image/"));
			if (images.size > 0) embed.setImage(images.first().url);

			embed.addFields([
				{
					name: message.translate("misc:QUOTE_ATTACHED"),
					value: msg.attachments.map(a => `[${a.name}](${a.url})`).join(", "),
				},
			]);
		}

		return embed;
	}

	async checkAutomod(message) {
		const inviteRegex = /(discord\.(gg|io|me|li)\/.+|discordapp\.com\/invite\/.+)/i;
		if (inviteRegex.test(message.content) && !message.channel.permissionsFor(message.member).has(PermissionsBitField.Flags.ManageMessages)) {
			await message.error("administration/automod:DELETED", null, { mention: true });
			await message.delete();
		}
	}

	async checkAfkStatus(client, message) {
		if (message.data.user.afk) {
			message.data.user.afk = null;
			await message.data.user.save();

			message.replyT("general/afk:DELETED", { user: message.author.username }, { mention: true });
		}
	}

	async checkMentionedUsersAfk(client, message) {
		for (const user of message.mentions.users.values()) {
			const userData = await client.getUserData(user.id);

			if (userData.afk) message.replyT("general/afk:IS_AFK", { user: user.getUsername(), message: userData.afk }, { ephemeral: true });
		}
	}
}

/**
 *
 * @param {import("../base/Client")} client
 * @param {import("discord.js").Message} message
 * @returns
 */
async function updateXp(message) {
	const memberData = message.data.member;
	const isInCooldown = xpCooldown[message.author.id];

	if (isInCooldown && isInCooldown > Date.now()) return;

	const toWait = Date.now() + 60 * 1000; // 1 min
	xpCooldown[message.author.id] = toWait;

	const won = message.client.functions.randomNum(1, 2);
	const newXp = memberData.exp + won;
	const neededXp = 5 * memberData.level ** 2 + 80 * memberData.level + 100;

	if (newXp > neededXp) {
		memberData.level += 1;
		memberData.exp = 0;

		message.replyT("misc:LEVEL_UP", { level: memberData.level }, { mention: false });
	} else {
		memberData.exp = newXp;
	}

	await memberData.save();
}

module.exports = MessageCreate;
