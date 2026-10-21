import { translateContext } from "@/helpers/functions.js";
import logger from "@/helpers/logger.js";
import { sendToPlayerChannel } from "@/helpers/music.js";
import { Player, Track, TrackStuckEvent } from "lavalink-client";

export const data = {
	name: "trackStuck",
	player: true,
	once: false,
};

export async function run(player: Player, track: Track | null, payload: TrackStuckEvent) {
	logger.warn(
		`[Lavalink] Track stuck in ${player.guildId} for ${payload.thresholdMs}ms:`,
		`"${track?.info.title}" (${track?.info.uri})`,
	);

	await sendToPlayerChannel(
		player,
		await translateContext(player.guildId, "music/play:ERR_STUCK", { track: track?.info.title }),
	);
}
