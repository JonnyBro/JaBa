import logger from "@/helpers/logger.js";
import { RainlinkNode } from "rainlink";

export const data = {
	name: "nodeDisconnect",
	player: true,
	once: false,
};

export async function run(node: RainlinkNode, code: number, reason: Buffer | string) {
	const nodeName = node.options.name;
	logger.warn(`Lavalink node ${nodeName}: Disconnected!\nCode: ${code}\nReason:\n`, reason);
}
