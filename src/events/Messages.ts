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
const xpCooldown: Record<string, number> = {};
const QUOTE_REGEXP =
	/discord\.com\/channels\/(?<guildId>\d+)\/(?<channelId>\d+)\/(?<messageId>\d+)/g;
const DELETE_BUTTON_ID = "quote_delete";

export const data = {
	name: "messageCreate",
	once: false,
};

export async function run(message: Message) {
	if (message.author.bot) return;
	if (!message.guild) return;
	if (message.content.match(QUOTE_REGEXP)) await handleLinkQuote(message);
	if (message.content.length > 3) await updateXp(message);

	return;
}

// Handle the quote deletion button
client.on("interactionCreate", async interaction => {
	if (!interaction.isButton()) return;
	if (interaction.customId !== DELETE_BUTTON_ID) return;

	await interaction.deferUpdate();

	if (interaction.message.deletable) await interaction.message.delete();
});

const handleLinkQuote = async (message: Message) => {
	const matches = [...message.content.matchAll(QUOTE_REGEXP)];
	if (!matches.length) return;

	const { guildId, channelId, messageId } = matches[0].groups || {};
	if (!guildId || !channelId || !messageId) return;

	try {
		const guild =
			client.guilds.cache.get(guildId) ||
			(await client.guilds.fetch(guildId).catch(() => null));
		if (!guild) return;

		const channel =
			(guild.channels.cache.get(channelId) as GuildTextBasedChannel) ||
			((await guild.channels.fetch(channelId).catch(() => null)) as GuildTextBasedChannel);
		if (!channel?.isTextBased()) return;

		const msg = await channel.messages.fetch(messageId).catch(() => null);
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
		if (e instanceof Error) {
			if (e.message.toLowerCase().includes("missing access")) {
				logger.error("Bot lacks permissions to access the message/channel");
			} else if (e.message.toLowerCase().includes("unknown message")) {
				logger.error("Message was deleted or not found");
			} else logger.error(`Unexpected error: ${e.message}`);
		}
	}
};

const updateXp = async (message: Message) => {
	const memberData = await client.getMemberData(message.author.id, message.guild!.id);
	const now = Date.now();

	if (xpCooldown[message.author.id] && xpCooldown[message.author.id] > now) return;

	xpCooldown[message.author.id] = now + 15_000; // 15 sec

	const won = randomNum(1, 3);
	const newXp = memberData.exp + won;
	const neededXp = getXpForNextLevel(memberData.level);

	try {
		if (newXp >= neededXp) {
			memberData.set({
				level: memberData.level + 1,
				exp: 0,
			});

			await replyTranslated(message, "misc:LEVEL_UP", { level: memberData.level });
		} else {
			memberData.set("exp", newXp);
		}

		await memberData.save();
	} catch (error) {
		logger.error(`Failed to update XP for ${message.author.id}: ${error}`);
		delete xpCooldown[message.author.id];
	}
};
