import { COLORS, formatUser, postModLog, quote } from "@/helpers/modlog.js";
import { Message, PartialMessage } from "discord.js";

export const data = {
	name: "messageUpdate",
	once: false,
};

export async function run(oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage) {
	const message = newMessage.partial ? await newMessage.fetch().catch(() => null) : newMessage;
	if (!message?.guild || message.author.bot || message.system) return;

	// Link previews and embeds also fire this event, only text changes matter
	if (!oldMessage.partial && oldMessage.content === message.content) return;

	const parentId = message.channel.isThread() ? message.channel.parentId : null;

	await postModLog(
		message.guild,
		"messageEdit",
		{ color: COLORS.orange, source: { channelId: message.channelId, parentId } },
		async t => [
			`**✏️ ${await t("MESSAGE_EDITED", { channel: `<#${message.channelId}>`, url: message.url })}**`,
			await t("AUTHOR", { user: formatUser(message.author) }),
			`**${await t("BEFORE")}**`,
			oldMessage.partial ? `-# ${await t("NOT_CACHED")}` : quote(oldMessage.content || "-"),
			`**${await t("AFTER")}**`,
			quote(message.content || "-"),
			`-# ID: ${message.id}`,
		],
	);
}
