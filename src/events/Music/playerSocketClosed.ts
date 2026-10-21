import logger from "@/helpers/logger.js";
import { Player, WebSocketClosedEvent } from "lavalink-client";

export const data = {
	name: "playerSocketClosed",
	player: true,
	once: false,
};

export async function run(player: Player, payload: WebSocketClosedEvent) {
	const log = payload.code >= 4000 && payload.code !== 4014 ? logger.warn : logger.debug;

	log(
		`[Lavalink] Voice socket closed in ${player.guildId} (code: ${payload.code}, by remote: ${payload.byRemote}):`,
		payload.reason || "No reason given",
	);
}
