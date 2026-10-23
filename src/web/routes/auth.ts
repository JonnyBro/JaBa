import logger from "@/helpers/logger.js";
import { FastifyInstance, FastifyRequest } from "fastify";
import { randomBytes } from "node:crypto";
import { buildAuthorizeUrl, exchangeCode, fetchUser } from "../discord-oauth.js";
import { safeRedirect } from "../utils.js";

const getRedirect = (req: FastifyRequest) => safeRedirect((req.query as { redirect?: string }).redirect);

export default async function authRoutes(fastify: FastifyInstance) {
	fastify.get("/auth/login", async (req, reply) => {
		const state = randomBytes(16).toString("hex");

		req.session.oauthState = state;
		req.session.redirect = getRedirect(req);

		return reply.redirect(buildAuthorizeUrl(state));
	});

	fastify.get("/auth/callback", async (req, reply) => {
		const { code, state } = req.query as { code?: string; state?: string };
		const redirect = safeRedirect(req.session.redirect);

		if (!code || !state || state !== req.session.oauthState) return reply.redirect("/");

		try {
			const accessToken = await exchangeCode(code);
			const user = await fetchUser(accessToken);

			// A new session id on login, the 24 hours of the session also start from here
			await req.session.regenerate();

			req.session.accessToken = accessToken;
			req.session.user = user;
		} catch (error) {
			logger.warn("[Dashboard] Discord login failed:", error);
			return reply.redirect("/");
		}

		return reply.redirect(redirect);
	});

	fastify.get("/auth/logout", async (req, reply) => {
		await req.session.destroy();

		return reply.redirect("/");
	});
}
