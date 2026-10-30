import { api, type Response } from "@/plugins/axios";
import type {
	AuditEntry,
	BlacklistEntry,
	BotSettings,
	BotCommand,
	CommandStats,
	CronTaskInfo,
	BotStats,
	Economy,
	GuildDetails,
	GuildInfo,
	GuildLeaderboardType,
	GuildListItem,
	GuildMember,
	GuildMemberDetails,
	GuildSettings,
	GuildStanding,
	LavalinkInfo,
	Me,
	MigrationInfo,
	MemberSort,
	MessageBlock,
	ModerationAction,
	MusicLyrics,
	MusicState,
	OwnerGuild,
	Paginated,
	PlayerAction,
	Playlist,
	PlaylistList,
	Profile,
	Remind,
	RepStanding,
	SearchSource,
} from "./types";

const get = async <T>(url: string, params?: object) => (await api.get<Response<T>>(url, { params })).data.data;

// Auth
export const loginUrl = (redirect: string) => `/auth/login?redirect=${encodeURIComponent(redirect)}`;
export const logoutUrl = "/auth/logout";

// Users
export const getMe = () => get<Me | null>("/api/users/me");

// Stats
export const getStats = () => get<BotStats>("/api/stats");

// Guilds
export const getGuilds = () => get<GuildListItem[]>("/api/guilds");
export const getGuild = (id: string) => get<GuildInfo | GuildDetails>(`/api/guilds/${encodeURIComponent(id)}`);
export const updateGuildSettings = async (id: string, body: Partial<GuildSettings>) =>
	(await api.patch<Response<GuildSettings>>(`/api/guilds/${encodeURIComponent(id)}/settings`, body)).data.data;

const guildUrl = (id: string, path = "") => `/api/guilds/${encodeURIComponent(id)}${path}`;
const post = async <T>(url: string, body?: object) => (await api.post<Response<T>>(url, body)).data.data;

// Members
export const getMembers = (id: string, params: { q?: string; sort?: MemberSort; page?: number; limit?: number }) =>
	get<Paginated<GuildMember>>(guildUrl(id, "/members"), params);
export const getMember = (id: string, userId: string) =>
	get<GuildMemberDetails>(guildUrl(id, `/members/${encodeURIComponent(userId)}`));
export const updateMemberEconomy = async (id: string, userId: string, body: Partial<Economy>) =>
	(await api.patch<Response<Economy>>(guildUrl(id, `/members/${encodeURIComponent(userId)}/economy`), body)).data
		.data;
export const resetMember = (id: string, userId: string) =>
	post<Economy>(guildUrl(id, `/members/${encodeURIComponent(userId)}/reset`));
export const resetEconomy = (id: string) => post<{ members: number }>(guildUrl(id, "/economy/reset"));
export const moderateMember = (
	id: string,
	userId: string,
	action: ModerationAction,
	body: { reason?: string; minutes?: number | null; deleteMessageDays?: number },
) => post<{ ok: true }>(guildUrl(id, `/members/${encodeURIComponent(userId)}/${action}`), body);

// Messages
export const sendTicketPanel = (id: string, body: { channelId: string; text: string; label: string; emoji?: string }) =>
	post<{ url: string }>(guildUrl(id, "/tickets/panel"), body);
export const sendMessage = (
	id: string,
	body: { channelId: string; blocks: MessageBlock[]; color: string | null; mentions: boolean },
) => post<{ url: string }>(guildUrl(id, "/messages"), body);

// Audit log
export const getAudit = (id: string, params: { page?: number; limit?: number }) =>
	get<Paginated<AuditEntry>>(guildUrl(id, "/audit"), params);

// Music, the state itself comes over the websocket
export const musicSocketUrl = (id: string) =>
	`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}${guildUrl(id, "/music/ws")}`;
export const getMusic = (id: string) => get<MusicState>(guildUrl(id, "/music"));
export const getMusicLyrics = (id: string) => get<MusicLyrics>(guildUrl(id, "/music/lyrics"));
export const musicAction = (id: string, action: PlayerAction) =>
	post<{ ok: true }>(guildUrl(id, "/music/action"), { action });
export const musicVolume = (id: string, value: number) => post<{ ok: true }>(guildUrl(id, "/music/volume"), { value });
export const musicSeek = (id: string, position: number) =>
	post<{ ok: true }>(guildUrl(id, "/music/seek"), { position });
export const musicRemove = (id: string, index: number) => post<{ ok: true }>(guildUrl(id, "/music/remove"), { index });
export const musicMove = (id: string, from: number, to: number) =>
	post<{ ok: true }>(guildUrl(id, "/music/move"), { from, to });
export const musicClear = (id: string) => post<{ ok: true }>(guildUrl(id, "/music/clear"));
export const musicPlay = (id: string, body: { query: string; source?: SearchSource; next?: boolean }) =>
	post<{ added: number; title: string | null }>(guildUrl(id, "/music/play"), body);

export const musicPlayPlaylist = (id: string, body: { playlistId: string; shuffle?: boolean }) =>
	post<{ added: number; unavailable: number; title: string }>(guildUrl(id, "/music/playlist"), body);

export const musicSaveQueue = (id: string, body: { playlistId?: string; name?: string }) =>
	post<{ added: number; skipped: number; playlistId: string; title: string }>(guildUrl(id, "/music/save"), body);

// Playlists
const playlistUrl = (id: string, path = "") => `/api/users/me/playlists/${encodeURIComponent(id)}${path}`;

export const getPlaylists = () => get<PlaylistList>("/api/users/me/playlists");
export const getPlaylist = (id: string) => get<Playlist>(playlistUrl(id));
export const createPlaylist = (name: string) => post<Playlist>("/api/users/me/playlists", { name });
export const renamePlaylist = async (id: string, name: string) =>
	(await api.patch<Response<Playlist>>(playlistUrl(id), { name })).data.data;
export const deletePlaylist = async (id: string) =>
	(await api.delete<Response<{ ok: true }>>(playlistUrl(id))).data.data;
export const addPlaylistTracks = (id: string, body: { query: string; source?: SearchSource }) =>
	post<{ added: number; skipped: number; title: string | null; playlist: Playlist }>(
		playlistUrl(id, "/tracks"),
		body,
	);
export const removePlaylistTrack = async (id: string, index: number) =>
	(await api.delete<Response<Playlist>>(playlistUrl(id, `/tracks/${index}`))).data.data;
export const uploadPlaylistFile = async (
	id: string,
	file: File,
	index?: number,
	onProgress?: (percent: number) => void,
) => {
	const form = new FormData();
	form.append("file", file);

	const url = playlistUrl(id, index === undefined ? "/upload" : `/tracks/${index}/upload`);
	const { data } = await api.post<Response<{ title: string; playlist: Playlist }>>(url, form, {
		onUploadProgress: event => event.total && onProgress?.(Math.round((event.loaded / event.total) * 100)),
	});

	return data.data;
};
export const renamePlaylistTrack = async (id: string, index: number, body: { title: string; author: string }) =>
	(await api.patch<Response<Playlist>>(playlistUrl(id, `/tracks/${index}`), body)).data.data;
export const movePlaylistTrack = (id: string, from: number, to: number) =>
	post<Playlist>(playlistUrl(id, "/move"), { from, to });

// Profile
export const getProfile = () => get<Profile>("/api/users/me/profile");
export const updateProfile = async (body: {
	bio?: string | null;
	birthdate?: { day: number; month: number; year: number } | null;
}) => (await api.patch<Response<Pick<Profile, "bio" | "birthdate">>>("/api/users/me/profile", body)).data.data;
export const createRemind = (body: { message: string; sendAt: number }) => post<Remind>("/api/users/me/reminds", body);
export const deleteRemind = async (remind: Remind) =>
	(
		await api.delete<Response<{ ok: true }>>("/api/users/me/reminds", {
			params: { createdAt: remind.createdAt, sendAt: remind.sendAt },
		})
	).data.data;

// Public
export const getCommands = (lang: string) => get<BotCommand[]>("/api/commands", { lang });
export const getRepLeaderboard = () => get<RepStanding[]>("/api/leaderboard/rep");
export const getGuildLeaderboard = (id: string, type: GuildLeaderboardType) =>
	get<{ type: GuildLeaderboardType; items: GuildStanding[] }>(guildUrl(id, "/leaderboard"), { type });

// Owner
const del = async <T>(url: string) => (await api.delete<Response<T>>(url)).data.data;

export const ownerLogsSocketUrl = () =>
	`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/api/owner/logs/ws`;
export const getBotSettings = () => get<BotSettings>("/api/owner/settings");
export const updateBotSettings = async (body: Partial<BotSettings>) =>
	(await api.patch<Response<BotSettings>>("/api/owner/settings", body)).data.data;
export const getOwnerGuilds = () => get<OwnerGuild[]>("/api/owner/guilds");
export const leaveGuild = (id: string) => post<{ ok: true }>(`/api/owner/guilds/${encodeURIComponent(id)}/leave`);
export const getLavalink = () => get<LavalinkInfo>("/api/owner/lavalink");
export const destroyPlayer = (guildId: string) =>
	post<{ ok: true }>(`/api/owner/lavalink/players/${encodeURIComponent(guildId)}/destroy`);
export const getTasks = () => get<{ tasks: CronTaskInfo[]; migrations: MigrationInfo[] }>("/api/owner/tasks");
export const runTask = (name: string) => post<{ started: true }>(`/api/owner/tasks/${encodeURIComponent(name)}/run`);
export const getBlacklist = () => get<BlacklistEntry[]>("/api/owner/blacklist");
export const addBlacklist = (body: { type: BlacklistEntry["type"]; id: string; reason?: string }) =>
	post<{ ok: true }>("/api/owner/blacklist", body);
export const removeBlacklist = (entry: Pick<BlacklistEntry, "type" | "id">) =>
	del<{ ok: true }>(`/api/owner/blacklist/${entry.type}/${encodeURIComponent(entry.id)}`);
export const getCommandStats = (days: number) => get<CommandStats>("/api/owner/stats/commands", { days });
