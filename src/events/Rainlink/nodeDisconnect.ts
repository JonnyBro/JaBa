import logger from "@/helpers/logger.js";
import { RainlinkNode } from "rainlink";

export const data = {
	name: "nodeDisconnect",
	player: true,
};

export async function run(
	node: RainlinkNode,
	code: number,
	reason: Buffer | string,
) {
	logger.error(
		`Lavalink node ${
			node.options.name
		}: Disconnected!\nCode: ${code}\nReason:\n`, reason,
	);
}
