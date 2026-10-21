import logger from "@/helpers/logger.js";
import { clearEmptyChannelTimer, deleteNowPlaying } from "@/helpers/music.js";
import { Player } from "lavalink-client";

export const data = {
	name: "playerDestroy",
	player: true,
	once: false,
};

export async function run(player: Player, reason?: string) {
	clearEmptyChannelTimer(player.guildId);
	await deleteNowPlaying(player);

	logger.debug(`[Lavalink] Player destroyed in ${player.guildId}:`, reason || "No reason given");
}
