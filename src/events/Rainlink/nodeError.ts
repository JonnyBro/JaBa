import logger from "@/helpers/logger.js";
import { RainlinkNode } from "rainlink";

export const data = {
	name: "nodeError",
	player: true,
};

export async function run(node: RainlinkNode, error: Error) {
	logger.error(`Lavalink node ${node.options.name}: Error Caught:\n`, error);
}
