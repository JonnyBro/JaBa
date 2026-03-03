import logger from "@/helpers/logger.js";
import useClient from "@/utils/use-client.js";
import { Player } from "lavalink-client";

const client = useClient();

export const data = {
	name: "playerCreate",
	player: true,
	once: false,
};

export async function run(player: Player) {
	if (!player) return;

	const guild = client.guilds.cache.get(player.guildId);
	if (!guild) return;

	logger.log(`Player created in ${guild.name} (${guild.id})`);
}
