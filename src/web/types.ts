import { Guild } from "discord.js";

export type SessionUser = {
	id: string;
	username: string;
	globalName: string | null;
	avatar: string | null;
};

export type OAuthGuild = {
	id: string;
	name: string;
	icon: string | null;
	owner: boolean;
	permissions: string;
};

declare module "fastify" {
	interface FastifyRequest {
		guild: Guild;
		canManage: boolean;
	}

	interface Session {
		user?: SessionUser;
		accessToken?: string;
		oauthState?: string;
		redirect?: string;
		guilds?: { list: OAuthGuild[]; fetchedAt: number };
	}
}
