import logger from "@/helpers/logger.js";
import { LavalinkNode } from "lavalink-client";

export const data = {
	name: "error",
	node: true,
	once: false,
};

export async function run(node: LavalinkNode, error: Error, payload: unknown) {
	logger.error(`[Lavalink] Node "${node.options.id}" error:`, error, payload ?? "");
}
