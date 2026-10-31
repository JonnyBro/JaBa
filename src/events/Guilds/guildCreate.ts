import logger from "@/helpers/logger.js";
import { isBlacklisted } from "@/services/bot-settings/index.js";
import { addTextWithThumbnail, containerMessage, createContainer } from "@/utils/create-container.js";
import useClient from "@/utils/use-client.js";
import { Guild } from "discord.js";

const client = useClient();

export const data = {
	name: "guildCreate",
	once: false,
};

export async function run(guild: Guild) {
	if (isBlacklisted("guild", guild.id)) {
		logger.info(`Left blacklisted guild ${guild.name} (${guild.id})`);
		return guild.leave();
	}

	const logChannelId = client.configService.get<string>("DEV_LOGS_JOINS");
	const logChannel = client.channels.cache.get(logChannelId);

	if (logChannel && logChannel.isSendable()) {
		const users = guild.members.cache.filter(m => !m.user.bot).size;
		const bots = guild.members.cache.filter(m => m.user.bot).size;

		const text = `### 📥 ${guild.name}\n-# Joined a new guild\nIt has **${users}** users and **${bots}** bots.`;
		const container = addTextWithThumbnail(createContainer(), text, guild.iconURL());

		await logChannel.send(containerMessage(container));
	}
}
