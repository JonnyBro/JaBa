import logger from "@/helpers/logger.js";
import useClient from "@/utils/use-client.js";
import { RainlinkPlayer } from "rainlink";

const client = useClient();

export const data = {
	name: "playerCreate",
	player: true,
	once: false,
};

export async function run(player: RainlinkPlayer) {
	if (!player) return;

	const guild = client.guilds.cache.get(player.guildId);
	if (!guild) return;

	/* TODO: Needs proper implementation
	const guildData = await client.getGuildData(player.guildId);

	if (guildData.reconnect.status) {
		return logger.log(
			`Player reconnected to ${guild.name} (${guild.id}), ${
				guildData.reconnect.queue.length
			} track(s) in queue`,
		);
	} */

	logger.log(`Player created in ${guild.name} (${guild.id})`);
}
