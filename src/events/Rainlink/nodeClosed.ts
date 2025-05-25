import logger from "@/helpers/logger.js";
import { RainlinkNode } from "rainlink";

export const data = {
	name: "nodeClosed",
	once: true,
	player: true,
};

export async function run(node: RainlinkNode) {
	logger.warn(`Lavalink node ${node.options.name}: Closed`);
}
