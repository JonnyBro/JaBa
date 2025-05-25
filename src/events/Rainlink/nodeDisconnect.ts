import logger from "@/helpers/logger.js";
import { RainlinkNode } from "rainlink";

export const data = {
	name: "nodeDisconnect",
	once: true,
	player: true,
};

export async function run(
	node: RainlinkNode,
	code: number,
	reason: string | Buffer<ArrayBufferLike>,
) {
	logger.error(
		`Lavalink node ${
			node.options.name
		}: Disconnected!\nCode: ${code}\nReason: ${reason}`,
	);
}
