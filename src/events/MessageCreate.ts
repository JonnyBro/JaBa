import {
	getUsername,
	getXpForNextLevel,
	randomNum,
	replyTranslated,
	translateContext,
} from "@/helpers/functions.js";
import logger from "@/helpers/logger.js";
import { createEmbed } from "@/utils/create-embed.js";
import useClient from "@/utils/use-client.js";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	GuildTextBasedChannel,
	Message,
} from "discord.js";

const client = useClient();
const xpCooldown: { [key: string]: number } = {};
const QUOTE_REGEXP = /discord.com\/channels\/([0-9].*)\/([0-9].*)\/([0-9].*[^/])\/{0,}/g;
const DELETE_BUTTON_ID = "quote_delete";

export const data = {
	name: "messageCreate",
	once: true,
};

export async function run(message: Message) {
	if (message.author.bot) return;
	if (!message.guild) return;

	if (message.content.match(new RegExp(`<(?:@[!&]?|#)${client.user.id}>`))) {
		return await replyTranslated(message, "misc:HELLO_SERVER");
	}

	if (message.content.match(QUOTE_REGEXP)) {
		return await handleLinkQuote(message, QUOTE_REGEXP);
	}

	await updateXp(message);
	await checkAfkStatus(message);
	await checkMentionedUsersAfk(message);

	return;
}

// Handle the quote deletion button
client.on("interactionCreate", async interaction => {
	if (!interaction.isButton()) return;
	if (interaction.customId !== DELETE_BUTTON_ID) return;
	if (interaction.message.deletable) return await interaction.message.delete();
});

async function handleLinkQuote(message: Message, regexp: RegExp) {
	const matched = [...message.content.matchAll(regexp)][0];
	const guildId = matched[1];
	const channelId = matched[2];
	const messageId = matched[3];

	try {
		const msg = await (
			client.guilds.cache.get(guildId)?.channels.cache.get(channelId) as GuildTextBasedChannel
		).messages.fetch(messageId);

		if (!msg) return;

		const embed = createEmbed({
			author: {
				name: await translateContext(message, "misc:QUOTE_TITLE", {
					user: getUsername(msg.author),
				}),
				iconURL: "https://wynem.com/assets/images/icons/quote.webp",
			},
			footer: {
				text: await translateContext(message, "misc:QUOTE_FOOTER"),
			},
			timestamp: msg.createdTimestamp,
		}).setThumbnail(msg.author.displayAvatarURL());

		if (msg.content) {
			embed.addFields([
				{
					name: await translateContext(message, "misc:QUOTE_CONTENT"),
					value: msg.content,
				},
			]);
		}

		if (msg.attachments.size > 0) {
			const firstAttachment = msg.attachments.find(a => a.contentType?.includes("image/"));

			if (firstAttachment) {
				embed.setImage(firstAttachment.url);

				embed.addFields([
					{
						name: await translateContext(message, "misc:QUOTE_ATTACHED"),
						value: msg.attachments.map(a => `[${a.name}](${a.url})`).join(", "),
					},
				]);
			}
		}

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setLabel(await translateContext(message, "misc:QUOTE_JUMP"))
				.setStyle(ButtonStyle.Link)
				.setURL(msg.url),
			new ButtonBuilder()
				.setCustomId(DELETE_BUTTON_ID)
				.setEmoji("1273665480451948544")
				.setStyle(ButtonStyle.Danger),
		);

		await message.reply({ embeds: [embed], components: [row] });
	} catch (e) {
		logger.error(e);
	}
}

async function checkAfkStatus(message: Message) {
	const data = await client.getUserData(message.author.id);

	if (data.afk) {
		data.afk = "";
		await data.save();

		await replyTranslated(message, "general/afk:DELETED");
	}
}

async function checkMentionedUsersAfk(message: Message) {
	for (const user of message.mentions.users.values()) {
		const userData = await client.getUserData(user.id);

		if (userData.afk) {
			replyTranslated(message, "general/afk:IS_AFK", {
				user: user.toString(),
				message: userData.afk,
			});
		}
	}
}

async function updateXp(message: Message) {
	const memberData = await client.getMemberData(message.author.id, message.guild!.id);
	const isInCooldown = xpCooldown[message.author.id];

	if (isInCooldown && isInCooldown > Date.now()) return;

	const toWait = Date.now() + 30_000; // 30 sec
	xpCooldown[message.author.id] = toWait;

	const won = randomNum(1, 3);
	const newXp = memberData.exp + won;
	const neededXp = getXpForNextLevel(memberData.level);

	if (newXp > neededXp) {
		memberData.level += 1;
		memberData.exp = 0;

		await replyTranslated(message, "misc:LEVEL_UP", { level: memberData.level });
	} else {
		memberData.exp = newXp;
	}

	await memberData.save();
}
