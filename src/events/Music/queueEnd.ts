import { translateContext } from "@/helpers/functions.js";
import logger from "@/helpers/logger.js";
import { deleteNowPlaying, getMusicSettings, sendToPlayerChannel } from "@/helpers/music.js";
import { Player } from "lavalink-client";

export const data = {
	name: "queueEnd",
	player: true,
	once: false,
};

// lavalink-client keeps its leave timer here, the option for it is global and can't be set per player
const QUEUE_EMPTY_TIMER = "internal_queueempty";

export async function run(player: Player) {
	await deleteNowPlaying(player);

	logger.debug(`[Lavalink] Queue ended in ${player.guildId}`);

	const { stay } = await getMusicSettings(player.guildId);
	if (stay) {
		clearTimeout(player.getData<ReturnType<typeof setTimeout> | undefined>(QUEUE_EMPTY_TIMER));
		player.setData(QUEUE_EMPTY_TIMER, undefined);
	}

	const key = stay ? "music/play:QUEUE_ENDED_STAY" : "music/play:QUEUE_ENDED";
	await sendToPlayerChannel(player, await translateContext(player.guildId, key));
}
