import packageJson from "@/../package.json" with { type: "json" };
import { PROJECT_ROOT, SUPER_CONTEXT } from "@/constants/index.js";
import logger from "@/helpers/logger.js";
import useClient from "@/utils/use-client.js";
import { STORAGE_QUOTA } from "@/helpers/audio-files.js";
import fastifyCookie from "@fastify/cookie";
import fastifyMultipart from "@fastify/multipart";
import fastifySession from "@fastify/session";
import fastifyStatic from "@fastify/static";
import fastifyWebsocket from "@fastify/websocket";
import Fastify, { FastifyError } from "fastify";
import { existsSync } from "node:fs";
import { join } from "node:path";
import authRoutes from "./routes/auth.js";
import filesRoutes from "./routes/files.js";
import guildRoutes from "./routes/guild/index.js";
import guildsRoutes from "./routes/guilds.js";
import ownerRoutes from "./routes/owner.js";
import playlistsRoutes from "./routes/playlists.js";
import profileRoutes from "./routes/profile.js";
import publicRoutes from "./routes/public.js";
import statsRoutes from "./routes/stats.js";
import usersRoutes from "./routes/users.js";
import "./types.js";
import { initMusicHub } from "./music-hub.js";
import { MongoSessionStore } from "./session-store.js";
import { fail } from "./utils.js";

const DEFAULT_PORT = 6548;
const SESSION_TTL = 24 * 60 * 60 * 1000;
const MIN_SECRET_LENGTH = 32;

export const startDashboard = async () => {
	const config = useClient().configService;
	const secret = config.get<string>("DASHBOARD_SECRET");
	const url = config.get<string>("DASHBOARD_URL");

	if (!url || !config.get<string>("CLIENT_SECRET") || !secret) {
		logger.warn(
			"[Dashboard] DASHBOARD_URL, DASHBOARD_SECRET or CLIENT_SECRET is not set, the dashboard is disabled",
		);
		return;
	}

	if (secret.length < MIN_SECRET_LENGTH) {
		logger.error(`[Dashboard] DASHBOARD_SECRET must be at least ${MIN_SECRET_LENGTH} characters long`);
		return;
	}

	const fastify = Fastify({
		trustProxy: config.get<string>("DASHBOARD_BEHIND_PROXY") === "true",
		routerOptions: { ignoreTrailingSlash: true },
	});

	// @fastify/websocket handles upgrades outside of the async context the client lives in, so useClient()
	// would fail in websocket hooks and handlers without entering it again here
	const client = useClient();
	fastify.addHook("onRequest", (_req, _reply, done) => SUPER_CONTEXT.run(client, done));

	await fastify.register(fastifyCookie);
	await fastify.register(fastifySession, {
		secret,
		cookieName: "jaba.sid",
		store: new MongoSessionStore(SESSION_TTL),
		saveUninitialized: false,
		cookie: {
			secure: url.startsWith("https://"),
			httpOnly: true,
			sameSite: "lax",
			maxAge: SESSION_TTL,
		},
	});

	await fastify.register(fastifyWebsocket);
	await fastify.register(fastifyMultipart, { limits: { fileSize: STORAGE_QUOTA, files: 1, fields: 0 } });

	await fastify.register(filesRoutes);
	await fastify.register(authRoutes);
	await fastify.register(usersRoutes);
	await fastify.register(statsRoutes);
	await fastify.register(publicRoutes);
	await fastify.register(profileRoutes);
	await fastify.register(playlistsRoutes);
	await fastify.register(guildsRoutes);
	await fastify.register(guildRoutes, { prefix: "/api/guilds/:id" });
	await fastify.register(ownerRoutes, { prefix: "/api/owner" });

	const frontendPath = join(PROJECT_ROOT, "..", "dashboard", "dist");
	const hasFrontend = existsSync(join(frontendPath, "index.html"));

	if (hasFrontend) await fastify.register(fastifyStatic, { root: frontendPath });

	fastify.setNotFoundHandler((req, reply) => {
		const isApi = req.url.startsWith("/api") || req.url.startsWith("/auth");
		if (hasFrontend && req.method === "GET" && !isApi) return reply.sendFile("index.html");

		return fail(reply, 404, "Not found");
	});

	fastify.setErrorHandler<FastifyError>((error, _req, reply) => {
		if (!error.statusCode || error.statusCode >= 500) logger.error("[Dashboard]", error);

		return fail(reply, error.statusCode ?? 500, error.statusCode ? error.message : "Internal server error");
	});

	initMusicHub();

	const port = Number(config.get<string>("DASHBOARD_PORT")) || DEFAULT_PORT;
	await fastify.listen({ host: config.get<string>("DASHBOARD_HOST") || "0.0.0.0", port });

	logger.ready(`[Dashboard] v${packageJson.version} is listening on port ${port} (${url})`);
};
