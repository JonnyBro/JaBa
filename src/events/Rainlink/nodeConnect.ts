import logger from "@/helpers/logger.js";
import { RainlinkNode } from "rainlink";

export const data = {
	name: "nodeConnect",
	once: true,
	player: true,
};

export async function run(node: RainlinkNode) {
	logger.ready(`Lavalink node ${node.options.name}: Ready!`);
}
