import logger from "@/helpers/logger.js";
import { PlayerCustom } from "@/types.js";
import useClient from "@/utils/use-client.js";

const client = useClient();

export const data = {
	name: "playerDestroy",
	player: true,
	once: false,
};

export async function run(player: PlayerCustom) {
	if (!player) return;

	const guild = client.guilds.cache.get(player.guildId);
	if (!guild) return;

	if (player.message?.deletable) await player.message.delete().catch(() => {});

	logger.log(`[Lavalink] Player destroyed in guild ${guild.name} (${guild.id})`);
}
