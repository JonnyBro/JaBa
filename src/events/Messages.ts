import { updateMember } from "@/helpers/economy.js";
import { getUsername, getXpForNextLevel, randomNum, shortenString, translateContext } from "@/helpers/functions.js";
import { handleLevelUp } from "@/helpers/levels.js";
import logger from "@/helpers/logger.js";
import { componentRouter } from "@/utils/component-router.js";
import { addTextWithThumbnail, containerMessage, createContainer, createText } from "@/utils/create-container.js";
import useClient from "@/utils/use-client.js";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	GuildTextBasedChannel,
	MediaGalleryItemBuilder,
	Message,
} from "discord.js";

const client = useClient();
const XP_COOLDOWN = 15_000;
const XP_COOLDOWN_PRUNE_SIZE = 1000;
const xpCooldown = new Map<string, number>();
const QUOTE_REGEXP = /discord\.com\/channels\/(?<guildId>\d+)\/(?<channelId>\d+)\/(?<messageId>\d+)/g;
const DELETE_BUTTON_ID = "QUOTE_DELETE";
const QUOTE_LENGTH = 3000;

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

componentRouter.register(DELETE_BUTTON_ID, async interaction => {
	if (!interaction.isButton()) return;
	await interaction.deferUpdate();
	if (interaction.message.deletable) await interaction.message.delete();
});

const handleLinkQuote = async (message: Message) => {
	const matches = [...message.content.matchAll(QUOTE_REGEXP)];
	if (!matches.length) return;

	const { guildId, channelId, messageId } = matches[0].groups || {};
	if (!guildId || !channelId || !messageId) return;

	try {
		const guild = client.guilds.cache.get(guildId) || (await client.guilds.fetch(guildId).catch(() => null));
		if (!guild) return;

		const channel =
			(guild.channels.cache.get(channelId) as GuildTextBasedChannel) ||
			((await guild.channels.fetch(channelId).catch(() => null)) as GuildTextBasedChannel);
		if (!channel?.isTextBased()) return;

		const msg = await channel.messages.fetch(messageId).catch(() => null);
		if (!msg) return;

		const sentAt = Math.floor(msg.createdTimestamp / 1000);
		const title = await translateContext(message, "misc:QUOTE_TITLE", { user: getUsername(msg.author) });
		const sent = await translateContext(message, "misc:QUOTE_FOOTER");
		const header = `### ${title}\n-# ${sent} <t:${sentAt}:f> · ${msg.channel}`;

		const container = addTextWithThumbnail(createContainer(), header, msg.author.displayAvatarURL());

		if (msg.content) container.addTextDisplayComponents(createText(shortenString(msg.content, QUOTE_LENGTH)));

		const images = msg.attachments.filter(a => a.contentType?.startsWith("image/")).first(10);
		if (images.length)
			container.addMediaGalleryComponents(gallery =>
				gallery.addItems(images.map(image => new MediaGalleryItemBuilder().setURL(image.url))),
			);

		const files = msg.attachments.filter(a => !a.contentType?.startsWith("image/"));
		if (files.size) {
			const attached = await translateContext(message, "misc:QUOTE_ATTACHED");
			const links = files.map(a => `[${a.name}](${a.url})`).join(", ");

			container.addTextDisplayComponents(createText(`-# ${attached}: ${links}`));
		}

		container.addActionRowComponents(
			new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setLabel(await translateContext(message, "misc:QUOTE_JUMP"))
					.setStyle(ButtonStyle.Link)
					.setURL(msg.url),
				new ButtonBuilder()
					.setCustomId(DELETE_BUTTON_ID)
					.setEmoji("1273665480451948544")
					.setStyle(ButtonStyle.Danger),
			),
		);

		await message.reply({ ...containerMessage(container), allowedMentions: { parse: [], repliedUser: false } });
	} catch (e) {
		if (e instanceof Error)
			if (e.message.toLowerCase().includes("missing access"))
				logger.error("Bot lacks permissions to access the message/channel");
			else if (e.message.toLowerCase().includes("unknown message"))
				logger.error("Message was deleted or not found");
			else logger.error(`Unexpected error: ${e.message}`);
	}
};

const updateXp = async (message: Message) => {
	const key = `${message.guildId}:${message.author.id}`;
	const now = Date.now();

	if ((xpCooldown.get(key) ?? 0) > now) return;

	xpCooldown.set(key, now + XP_COOLDOWN);

	if (xpCooldown.size > XP_COOLDOWN_PRUNE_SIZE)
		for (const [id, until] of xpCooldown) if (until <= now) xpCooldown.delete(id);

	try {
		const memberData = await client.getMemberData(message.guildId!, message.author.id);
		const won = randomNum(1, 3);
		const needed = getXpForNextLevel(memberData.level);

		if (memberData.exp + won < needed) {
			await updateMember({ _id: memberData._id }, { $inc: { exp: won } });
			return;
		}

		const result = await updateMember(
			{ _id: memberData._id, level: memberData.level, exp: memberData.exp },
			{ $inc: { level: 1 }, $set: { exp: memberData.exp + won - needed } },
		);

		if (result.modifiedCount) await handleLevelUp(message as Message<true>, memberData, memberData.level + 1);
	} catch (error) {
		logger.error(`Failed to update XP for ${message.author.id}: ${error}`);
		xpCooldown.delete(key);
	}
};
