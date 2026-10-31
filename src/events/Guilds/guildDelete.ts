import { addTextWithThumbnail, containerMessage, createContainer } from "@/utils/create-container.js";
import useClient from "@/utils/use-client.js";
import { Guild } from "discord.js";

const client = useClient();

export const data = {
	name: "guildDelete",
	once: false,
};

export async function run(guild: Guild) {
	const logChannelId = client.configService.get<string>("DEV_LOGS_JOINS");
	const logChannel = client.channels.cache.get(logChannelId);

	if (logChannel && logChannel.isSendable()) {
		const text = `### 📤 ${guild.name}\n-# Left a guild`;
		const container = addTextWithThumbnail(createContainer(), text, guild.iconURL());

		await logChannel.send(containerMessage(container));
	}
}
