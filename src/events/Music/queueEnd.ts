import { translateContext } from "@/helpers/functions.js";
import logger from "@/helpers/logger.js";
import { deleteNowPlaying, sendToPlayerChannel } from "@/helpers/music.js";
import { Player } from "lavalink-client";

export const data = {
	name: "queueEnd",
	player: true,
	once: false,
};

export async function run(player: Player) {
	await deleteNowPlaying(player);

	logger.debug(`[Lavalink] Queue ended in ${player.guildId}`);

	await sendToPlayerChannel(player, await translateContext(player.guildId, "music/play:QUEUE_ENDED"));
}
