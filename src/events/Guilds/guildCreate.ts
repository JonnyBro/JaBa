import { createEmbed } from "@/utils/create-embed.js";
import useClient from "@/utils/use-client.js";
import { Guild } from "discord.js";

const client = useClient();

export const data = {
	name: "guildCreate",
	once: false,
};

export async function run(guild: Guild) {
	const logChannelId = client.configService.get<string>("devLogs.joins");
	const logChannel = client.channels.cache.get(logChannelId);

	if (logChannel && logChannel.isSendable()) {
		const users = guild.members.cache.filter(m => !m.user.bot).size;
		const bots = guild.members.cache.filter(m => m.user.bot).size;

		const embed = createEmbed({
			author: {
				name: guild.name,
				iconURL: guild.iconURL() || client.user.avatarURL() || undefined,
			},
			description: `Joined a new guild!\n${
				guild.name
			}\nIt has **${users}** users and **${bots}** bots.`,
		});

		await logChannel.send({
			embeds: [embed],
		});
	}
}
