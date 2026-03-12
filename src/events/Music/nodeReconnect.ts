import logger from "@/helpers/logger.js";
import { LavalinkNode } from "lavalink-client";

export const data = {
	name: "reconnecting",
	player: true,
	node: true,
	once: false,
};

export async function run(node: LavalinkNode) {
	logger.warn(`[Lavalink] Node "${node.options.id}" is reconnecting...`);
}
