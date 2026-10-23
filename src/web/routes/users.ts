import { FastifyInstance } from "fastify";
import { avatarUrl, isOwner, send } from "../utils.js";

export default async function usersRoutes(fastify: FastifyInstance) {
	fastify.get("/api/users/me", async (req, reply) => {
		const user = req.session.user;
		if (!user) return send(reply, null);

		return send(reply, {
			id: user.id,
			username: user.username,
			displayName: user.globalName || user.username,
			avatar: avatarUrl(user.id, user.avatar),
			owner: isOwner(user.id),
		});
	});
}
