import { translateContext } from "@/helpers/functions.js";
import logger from "@/helpers/logger.js";
import { sendToPlayerChannel } from "@/helpers/music.js";
import { Player, Track, TrackExceptionEvent, UnresolvedTrack } from "lavalink-client";

export const data = {
	name: "trackError",
	player: true,
	once: false,
};

export async function run(player: Player, track: Track | UnresolvedTrack | null, payload: TrackExceptionEvent) {
	logger.warn(
		`[Lavalink] Track error in ${player.guildId}: "${track?.info.title}" (${track?.info.uri})\n`,
		`Message: ${payload.exception?.message || payload.error}\n`,
		`Cause: ${payload.exception?.cause || "unknown"}`,
	);

	await sendToPlayerChannel(
		player,
		await translateContext(player.guildId, "music/play:ERR_TRACK", {
			track: track?.info.title,
			error: payload.exception?.message || payload.error,
		}),
	);
}
