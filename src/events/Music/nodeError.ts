import logger from "@/helpers/logger.js";
import { LavalinkNode } from "lavalink-client";

export const data = {
	name: "error",
	player: true,
	node: true,
	once: false,
};

export async function run(node: LavalinkNode, error: Error, payload: unknown) {
	logger.error(`Lavalink node ${node.options.id}: Error Caught:\n`, error, "Payload:\n", payload);
}
