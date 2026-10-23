import useClient from "@/utils/use-client.js";
import { OAuthGuild, SessionUser } from "./types.js";

const API = "https://discord.com/api/v10";
const SCOPES = ["identify", "guilds"];

const config = () => {
	const client = useClient();

	return {
		clientId: client.configService.get<string>("CLIENT_ID"),
		clientSecret: client.configService.get<string>("CLIENT_SECRET"),
		redirectUri: `${client.configService.get<string>("DASHBOARD_URL")}/auth/callback`,
	};
};

export const buildAuthorizeUrl = (state: string) => {
	const { clientId, redirectUri } = config();
	const params = new URLSearchParams({
		/* eslint-disable camelcase */
		client_id: clientId,
		redirect_uri: redirectUri,
		response_type: "code",
		/* eslint-enable camelcase */
		scope: SCOPES.join(" "),
		state,
		prompt: "none",
	});

	return `https://discord.com/oauth2/authorize?${params}`;
};

export const exchangeCode = async (code: string) => {
	const { clientId, clientSecret, redirectUri } = config();
	const res = await fetch(`${API}/oauth2/token`, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			/* eslint-disable camelcase */
			client_id: clientId,
			client_secret: clientSecret,
			grant_type: "authorization_code",
			code,
			redirect_uri: redirectUri,
			/* eslint-enable camelcase */
		}),
	});

	if (!res.ok) throw new Error(`Discord token exchange failed: ${res.status} ${await res.text()}`);

	return ((await res.json()) as { access_token: string }).access_token;
};

const get = async <T>(path: string, token: string) => {
	const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
	if (!res.ok) throw new Error(`Discord API ${path} failed: ${res.status}`);

	return (await res.json()) as T;
};

export const fetchUser = async (token: string): Promise<SessionUser> => {
	const user = await get<{ id: string; username: string; global_name: string | null; avatar: string | null }>(
		"/users/@me",
		token,
	);

	return { id: user.id, username: user.username, globalName: user.global_name, avatar: user.avatar };
};

export const fetchGuilds = (token: string) => get<OAuthGuild[]>("/users/@me/guilds", token);
