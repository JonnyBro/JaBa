import logger from "@/helpers/logger.js";
import { restorePlayers } from "@/helpers/music-resume.js";
import { InvalidLavalinkRestRequest, LavalinkNode, LavalinkPlayer } from "lavalink-client";

export const data = {
	name: "resumed",
	node: true,
	once: false,
};

export async function run(
	node: LavalinkNode,
	_payload: unknown,
	players: LavalinkPlayer[] | InvalidLavalinkRestRequest,
) {
	if (!Array.isArray(players)) {
		logger.warn(`[Lavalink] Node "${node.id}" resumed, but its players could not be fetched`);
		return;
	}

	logger.info(`[Lavalink] Node "${node.id}" resumed with ${players.length} player(s)`);

	await restorePlayers(node, players);
}
