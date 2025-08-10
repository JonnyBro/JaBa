import { createEmbed } from "@/utils/create-embed.js";
import useClient from "@/utils/use-client.js";
import { Guild } from "discord.js";

const client = useClient();

export const data = {
	name: "guildDelete",
	once: false,
};

export async function run(guild: Guild) {
	const logChannelId = client.configService.get<string>("devLogs.joins");
	const logChannel = client.channels.cache.get(logChannelId);

	if (logChannel && logChannel.isSendable()) {
		const embed = createEmbed({
			author: {
				name: guild.name,
				iconURL: guild.iconURL() || client.user.avatarURL() || undefined,
			},
			description: `Left from guild!\n${guild.name}`,
		});

		await logChannel.send({
			embeds: [embed],
		});
	}
}
