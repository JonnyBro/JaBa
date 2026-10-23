import useClient from "@/utils/use-client.js";
import { OAuth2Scopes, PermissionsBitField } from "discord.js";
import { FastifyInstance, FastifyRequest } from "fastify";
import { fetchGuilds } from "../discord-oauth.js";
import { OAuthGuild } from "../types.js";
import { canManage, requireUser, send } from "../utils.js";

const GUILDS_CACHE_MS = 60_000;

const iconUrl = (id: string, icon: string | null) =>
	icon ? `https://cdn.discordapp.com/icons/${id}/${icon}.${icon.startsWith("a_") ? "gif" : "png"}?size=128` : null;

const inviteUrl = (guildId: string) =>
	useClient().generateInvite({
		scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands],
		permissions: [PermissionsBitField.Flags.Administrator],
		guild: guildId,
		disableGuildSelect: true,
	});

// Discord rate limits /users/@me/guilds hard, so the list is kept in the session for a minute
const getOAuthGuilds = async (req: FastifyRequest): Promise<OAuthGuild[]> => {
	const { accessToken, guilds } = req.session;
	if (!accessToken) return [];
	if (guilds && Date.now() - guilds.fetchedAt < GUILDS_CACHE_MS) return guilds.list;

	const list = await fetchGuilds(accessToken);
	req.session.guilds = { list, fetchedAt: Date.now() };

	return list;
};

const getVisibleGuilds = async (req: FastifyRequest) => {
	const bot = useClient().guilds.cache;

	return (await getOAuthGuilds(req))
		.map(g => ({ id: g.id, name: g.name, icon: g.icon, manageable: g.owner || canManage(g.permissions) }))
		.filter(g => g.manageable || bot.has(g.id));
};

export default async function guildsRoutes(fastify: FastifyInstance) {
	fastify.get("/api/guilds", { preHandler: requireUser }, async (req, reply) => {
		const client = useClient();

		const list = (await getVisibleGuilds(req))
			.map(g => {
				const botPresent = client.guilds.cache.has(g.id);

				return {
					id: g.id,
					name: g.name,
					icon: iconUrl(g.id, g.icon),
					botPresent,
					manageable: g.manageable,
					invite: botPresent ? null : inviteUrl(g.id),
				};
			})
			.sort(
				(a, b) =>
					Number(b.botPresent) - Number(a.botPresent) ||
					Number(b.manageable) - Number(a.manageable) ||
					a.name.localeCompare(b.name),
			);

		return send(reply, list);
	});
}
