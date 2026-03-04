import logger from "@/helpers/logger.js";
import { LavalinkNode } from "lavalink-client";

export const data = {
	name: "connect",
	player: true,
	node: true,
	once: false,
};

export async function run(node: LavalinkNode) {
	logger.ready(`[Lavalink] Node "${node.options.id}" is ready!`);
}
