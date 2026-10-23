import packageJson from "@/../package.json" with { type: "json" };
import useClient from "@/utils/use-client.js";
import { OAuth2Scopes, PermissionsBitField } from "discord.js";
import { FastifyInstance } from "fastify";
import { send } from "../utils.js";

export default async function statsRoutes(fastify: FastifyInstance) {
	fastify.get("/api/stats", async (_req, reply) => {
		const client = useClient();
		const players = [...client.lavalink.players.values()];

		return send(reply, {
			version: packageJson.version,
			invite: client.generateInvite({
				scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands],
				permissions: [PermissionsBitField.Flags.Administrator],
			}),
			guilds: client.guilds.cache.size,
			users: client.guilds.cache.reduce((sum, guild) => sum + guild.memberCount, 0),
			commands: client.commands.length,
			uptime: client.uptime,
			ping: client.ws.ping,
			music: {
				players: players.length,
				playing: players.filter(p => p.playing && !p.paused).length,
				nodes: client.lavalink.nodeManager.nodes.size,
				connectedNodes: [...client.lavalink.nodeManager.nodes.values()].filter(n => n.connected).length,
			},
		});
	});
}
