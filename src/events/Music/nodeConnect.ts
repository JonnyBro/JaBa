import logger from "@/helpers/logger.js";
import { LavalinkNode } from "lavalink-client";

export const data = {
	name: "connect",
	node: true,
	once: false,
};

export async function run(node: LavalinkNode) {
	logger.ready(`[Lavalink] Node "${node.options.id}" connected (${node.options.host}:${node.options.port})`);

	const info = await node.fetchInfo().catch(() => null);
	if (!info) return;

	logger.info(
		`[Lavalink] Node "${node.options.id}" is running Lavalink ${info.version.semver}.`,
		`Sources: ${info.sourceManagers.join(", ")}.`,
		`Plugins: ${info.plugins.map(p => `${p.name}@${p.version}`).join(", ") || "none"}`,
	);
}
