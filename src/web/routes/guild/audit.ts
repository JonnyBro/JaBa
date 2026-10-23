import AuditLogModel from "@/models/AuditLogModel.js";
import { FastifyInstance } from "fastify";
import { send } from "../../utils.js";

const MAX_PAGE_SIZE = 100;

export default async function auditRoutes(fastify: FastifyInstance) {
	fastify.get("/audit", async (req, reply) => {
		const query = req.query as { page?: string; limit?: string };
		const limit = Math.min(Math.max(Number(query.limit) || 25, 1), MAX_PAGE_SIZE);
		const page = Math.max(Number(query.page) || 1, 1);
		const filter = { guildId: req.guild.id };

		const [items, total] = await Promise.all([
			AuditLogModel.find(filter)
				.sort({ createdAt: -1 })
				.skip((page - 1) * limit)
				.limit(limit)
				.lean(),
			AuditLogModel.countDocuments(filter),
		]);

		return send(reply, {
			items: items.map(({ _id, ...entry }) => ({
				id: String(_id),
				...entry,
				createdAt: entry.createdAt.getTime(),
			})),
			total,
		});
	});
}
