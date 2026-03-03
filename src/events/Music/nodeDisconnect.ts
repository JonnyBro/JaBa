import logger from "@/helpers/logger.js";
import { LavalinkNode } from "lavalink-client";

export const data = {
	name: "disconnect",
	player: true,
	node: true,
	once: false,
};

export async function run(
	node: LavalinkNode,
	reason: {
		code?: number;
		reason?: string;
	},
) {
	logger.warn(`Lavalink node ${node.options.id}: Disconnected!\nReason:\n`, reason.reason);
}
