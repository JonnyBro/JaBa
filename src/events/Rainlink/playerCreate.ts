import logger from "@/helpers/logger.js";
import useClient from "@/utils/use-client.js";
import { RainlinkPlayer } from "rainlink";

const client = useClient();

export const data = {
	name: "playerCreate",
	player: true,
};

export async function run(player: RainlinkPlayer) {
	if (!player) return;

	const guild = client.guilds.cache.get(player.guildId);
	if (!guild) return;

	const guildData = await client.getGuildData(player.guildId);

	if (guildData.reconnect.status) {
		logger.log(
			`Player reconnected to ${guild.name} (${guild.id}), ${
				guildData.reconnect.queue.length
			} track(s) in queue`,
		);
	} else {
		logger.log(`Player created in ${guild.name} (${guild.id})`);
	}
}
