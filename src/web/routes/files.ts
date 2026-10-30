import { getFilePath } from "@/helpers/audio-files.js";
import AudioFileModel from "@/models/AudioFileModel.js";
import { FastifyInstance } from "fastify";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { fail } from "../utils.js";

/** Lavalink downloads uploaded tracks from here, it has no session, so the token in the address is the access */
export default async function filesRoutes(fastify: FastifyInstance) {
	fastify.get("/files/:token", async (req, reply) => {
		const { token } = req.params as { token: string };
		const file = /^[a-f\d]{64}$/.test(token)
			? await AudioFileModel.findOne({ token, expiredAt: null }).lean()
			: null;
		const size = file && (await stat(await getFilePath(file)).catch(() => null))?.size;
		if (!file || !size) return fail(reply, 404, "Not found");

		reply.header("Accept-Ranges", "bytes").type("application/octet-stream");

		// Lavalink seeks with range requests
		const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? "");
		if (!range || (!range[1] && !range[2]))
			return reply.header("Content-Length", size).send(createReadStream(await getFilePath(file)));

		const start = range[1] ? Number(range[1]) : Math.max(size - Number(range[2]), 0);
		const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
		if (start > end || start >= size) return reply.status(416).header("Content-Range", `bytes */${size}`).send();

		return reply
			.status(206)
			.header("Content-Range", `bytes ${start}-${end}/${size}`)
			.header("Content-Length", end - start + 1)
			.send(createReadStream(await getFilePath(file), { start, end }));
	});
}
