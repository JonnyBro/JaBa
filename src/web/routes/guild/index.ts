import useClient from "@/utils/use-client.js";
import { PermissionsBitField } from "discord.js";
import { FastifyInstance } from "fastify";
import { fail, isOwner } from "../../utils.js";
import auditRoutes from "./audit.js";
import infoRoutes from "./info.js";
import leaderboardRoutes from "./leaderboard.js";
import membersRoutes from "./members.js";
import messagesRoutes from "./messages.js";
import musicRoutes from "./music.js";
import settingsRoutes from "./settings.js";
import ticketsRoutes from "./tickets.js";

// Access is checked against the bot's own view of the guild, the OAuth guild list can be minutes old
export default async function guildRoutes(fastify: FastifyInstance) {
	fastify.decorateRequest("guild", null as never);
	fastify.decorateRequest("canManage", false);

	fastify.addHook("preHandler", async (req, reply) => {
		const user = req.session.user;
		if (!user) return fail(reply, 401, "Not signed in");

		const guild = useClient().guilds.cache.get((req.params as { id: string }).id);
		const member = guild && (await guild.members.fetch(user.id).catch(() => null));
		if (!guild || (!member && !isOwner(user.id))) return fail(reply, 403, "No access to this server");

		req.guild = guild;
		req.canManage = isOwner(user.id) || !!member?.permissions.has(PermissionsBitField.Flags.ManageGuild);
	});

	await fastify.register(infoRoutes);
	await fastify.register(musicRoutes);
	await fastify.register(leaderboardRoutes);

	await fastify.register(async manage => {
		manage.addHook("preHandler", async (req, reply) => {
			if (!req.canManage) return fail(reply, 403, "You need the Manage Server permission");
		});

		await manage.register(settingsRoutes);
		await manage.register(membersRoutes);
		await manage.register(ticketsRoutes);
		await manage.register(messagesRoutes);
		await manage.register(auditRoutes);
	});
}
