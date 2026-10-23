import { handleNodeReady } from "@/helpers/music-resume.js";
import { LavalinkNode } from "lavalink-client";

export const data = {
	name: "raw",
	node: true,
	once: false,
};

// There is no dedicated event for a fresh session, only "resumed", so catch the raw ready op
export async function run(node: LavalinkNode, payload: { op?: string; sessionId?: string; resumed?: boolean }) {
	if (payload.op !== "ready" || !payload.sessionId) return;

	await handleNodeReady(node, payload.sessionId, !!payload.resumed);
}
