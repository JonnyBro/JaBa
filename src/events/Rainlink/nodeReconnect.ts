import logger from "@/helpers/logger.js";
import { RainlinkNode } from "rainlink";

export const data = {
	name: "nodeReconnect",
	player: true,
	once: false,
};

export async function run(node: RainlinkNode) {
	logger.error(`Lavalink node ${node.options.name}: reconnecting...`);
}
