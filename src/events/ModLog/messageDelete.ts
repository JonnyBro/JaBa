import { isHoneypotChannel } from "@/helpers/honeypot.js";
import { COLORS, formatUser, postModLog, quote } from "@/helpers/modlog.js";
import { Message, PartialMessage } from "discord.js";

export const data = {
	name: "messageDelete",
	once: false,
};

export async function run(message: Message | PartialMessage) {
	const guild = message.guild;
	if (!guild || message.author?.bot || message.system) return;
	// The honeypot logs these itself, with the forwarded message
	if (await isHoneypotChannel(guild.id, message.channelId)) return;

	const parentId = message.channel.isThread() ? message.channel.parentId : null;

	await postModLog(
		guild,
		"messageDelete",
		{ color: COLORS.red, source: { channelId: message.channelId, parentId } },
		async t => [
			`**🗑️ ${await t("MESSAGE_DELETED", { channel: `<#${message.channelId}>` })}**`,
			message.author && (await t("AUTHOR", { user: formatUser(message.author) })),
			message.content ? quote(message.content) : message.partial && `-# ${await t("NOT_CACHED")}`,
			!!message.attachments?.size &&
				(await t("ATTACHMENTS", { list: message.attachments.map(a => `\`${a.name}\``).join(", ") })),
			`-# ID: ${message.id}`,
		],
	);
}
