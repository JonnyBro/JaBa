import { IS_PROD } from "@/constants/index.js";
import logger from "@/helpers/logger.js";
import useClient from "@/utils/use-client.js";
import { FastifyInstance, FastifyRequest } from "fastify";
import { randomBytes } from "node:crypto";
import { buildAuthorizeUrl, exchangeCode, fetchUser } from "../discord-oauth.js";
import { SessionUser } from "../types.js";
import { fail, safeRedirect } from "../utils.js";

const getRedirect = (req: FastifyRequest) => safeRedirect((req.query as { redirect?: string }).redirect);

const devUsers = (): Record<string, SessionUser> => {
	const owner = useClient().configService.get<string>("OWNER");

	return {
		owner: { id: owner, username: "dev_owner", globalName: "Dev Owner", avatar: null },
		user: { id: "1", username: "dev_user", globalName: "Dev User", avatar: null },
	};
};

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

	if (!IS_PROD)
		fastify.get("/auth/dev/:name", async (req, reply) => {
			const user = devUsers()[(req.params as { name: string }).name];
			if (!user) return fail(reply, 404, "Unknown dev account");

			await req.session.regenerate();
			req.session.user = user;

			return reply.redirect(getRedirect(req));
		});

	fastify.get("/auth/logout", async (req, reply) => {
		await req.session.destroy();

		return reply.redirect("/");
	});
}
