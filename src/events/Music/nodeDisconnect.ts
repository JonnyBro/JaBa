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
	logger.warn(
		`[Lavalink] Node "${node.options.id}" has disconnected!
		Reason: `,
		reason.reason || "No reason given",
	);
}
