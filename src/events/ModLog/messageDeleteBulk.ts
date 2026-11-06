import { COLORS, postModLog } from "@/helpers/modlog.js";
import { GuildTextBasedChannel, Message, PartialMessage, ReadonlyCollection, Snowflake } from "discord.js";

export const data = {
	name: "messageDeleteBulk",
	once: false,
};

export async function run(
	messages: ReadonlyCollection<Snowflake, Message | PartialMessage>,
	channel: GuildTextBasedChannel,
) {
	const parentId = channel.isThread() ? channel.parentId : null;

	await postModLog(
		channel.guild,
		"messageDelete",
		{ color: COLORS.red, source: { channelId: channel.id, parentId } },
		async t => [`**🗑️ ${await t("MESSAGES_PURGED", { count: messages.size, channel: channel.toString() })}**`],
	);
}
