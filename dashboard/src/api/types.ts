export type Me = {
	id: string;
	username: string;
	displayName: string;
	avatar: string;
	owner: boolean;
};

export type BotStats = {
	version: string;
	invite: string;
	guilds: number;
	users: number;
	commands: number;
	uptime: number | null;
	ping: number;
	music: {
		players: number;
		playing: number;
		nodes: number;
		connectedNodes: number;
	};
};

export type GuildListItem = {
	id: string;
	name: string;
	icon: string | null;
	botPresent: boolean;
	manageable: boolean;
	invite: string | null;
};

export type GuildSettings = {
	language: string;
	birthdays: string | null;
};

export type GuildChannel = {
	id: string;
	name: string;
	category: string | null;
};

export type GuildLanguage = {
	locale: string;
	name: string;
	nativeName: string;
};

/** What every member of the guild gets */
export type GuildInfo = {
	id: string;
	name: string;
	icon: string | null;
	memberCount: number;
	embedColor: string | null;
	canManage: boolean;
};

/** Only returned to those who can manage the guild */
export type GuildDetails = GuildInfo & {
	settings: GuildSettings;
	channels: GuildChannel[];
	languages: GuildLanguage[];
};

export type Paginated<T> = {
	items: T[];
	total: number;
};

export type Economy = {
	money: number;
	bank: number;
	exp: number;
	level: number;
};

export type MemberSort = "name" | "money" | "bank" | "level" | "joined";

export type GuildMember = {
	id: string;
	username: string;
	displayName: string;
	avatar: string;
	bot: boolean;
	joinedAt: number | null;
	timeoutUntil: number | null;
	economy: Economy | null;
};

export type Transaction = {
	user: string;
	amount: number;
	date: number;
	type: string;
};

export type ModerationAction = "kick" | "ban" | "timeout";

export type GuildMemberDetails = GuildMember & {
	registeredAt: number | null;
	rep: number;
	roles: { id: string; name: string; color: string }[];
	transactions: Transaction[];
	moderation: Record<ModerationAction, boolean>;
};

export type MessageBlock =
	| { type: "text"; content: string }
	| { type: "separator"; divider: boolean; large: boolean }
	| { type: "gallery"; urls: string[] }
	| { type: "buttons"; buttons: { label: string; url: string }[] };

export type AuditEntry = {
	id: string;
	actorId: string;
	actorName: string;
	actorAvatar: string | null;
	action: string;
	targetId: string | null;
	targetName: string | null;
	details: Record<string, unknown>;
	createdAt: number;
};

export type MusicTrack = {
	title: string;
	author: string;
	uri: string | null;
	artworkUrl: string | null;
	duration: number;
	isStream: boolean;
	source: string | null;
	requester: { id: string; name: string; avatar: string | null } | null;
};

export type RepeatMode = "off" | "track" | "queue";

type MusicStateBase = {
	timestamp: number;
	maxVolume: number;
	userVoiceChannel: { id: string; name: string } | null;
};

export type MusicState =
	| (MusicStateBase & { active: false; canStart: boolean })
	| (MusicStateBase & {
			active: true;
			canControl: boolean;
			voiceChannel: { id: string; name: string } | null;
			current: MusicTrack;
			position: number;
			paused: boolean;
			volume: number;
			repeatMode: RepeatMode;
			autoplay: boolean;
			hasPrevious: boolean;
			queue: MusicTrack[];
			queueTotal: number;
			queueDuration: number;
	  });

export type PlayerAction = "pause" | "back" | "skip" | "stop" | "loop" | "shuffle" | "autoplay";

export type SearchSource = "ytm" | "yt" | "ym" | "sp" | "sc";

export type PlaylistTrack = Omit<MusicTrack, "requester">;

export type PlaylistSummary = {
	id: string;
	name: string;
	trackCount: number;
	duration: number;
	artworkUrl: string | null;
	updatedAt: string;
};

export type Playlist = PlaylistSummary & { tracks: PlaylistTrack[] };

export type PlaylistList = { max: number; maxTracks: number; items: PlaylistSummary[] };

export type Remind = {
	message: string;
	createdAt: number;
	sendAt: number;
};

export type Profile = {
	rep: number;
	bio: string | null;
	birthdate: number | null;
	registeredAt: number;
	reminds: Remind[];
	servers: {
		id: string;
		name: string;
		icon: string | null;
		money: number;
		bank: number;
		level: number;
		exp: number;
	}[];
};

export type BotCommand = {
	name: string;
	displayName: string;
	category: string;
	description: string;
	type: "slash" | "user" | "message";
	guildOnly: boolean;
	usage: string;
	examples: string;
};

export type RepStanding = {
	position: number;
	id: string;
	displayName: string;
	avatar: string | null;
	rep: number;
};

export type GuildLeaderboardType = "credits" | "level";

export type GuildStanding = {
	position: number;
	id: string;
	displayName: string;
	avatar: string;
	money: number;
	bank: number;
	level: number;
	exp: number;
	nextLevelExp: number;
};

export type BotSettings = {
	maintenance: { enabled: boolean; message: string | null };
	status: string | null;
};

export type OwnerGuild = {
	id: string;
	name: string;
	icon: string | null;
	memberCount: number;
	joinedAt: number | null;
	ownerId: string;
	playing: boolean;
	blacklisted: boolean;
};

export type LavalinkInfo = {
	nodes: {
		id: string;
		connected: boolean;
		version: string | null;
		players: number;
		playingPlayers: number;
		uptime: number;
		memory: { used: number; allocated: number } | null;
		cpu: { lavalink: number; system: number } | null;
	}[];
	players: {
		guildId: string;
		guildName: string;
		voiceChannel: string | null;
		listeners: number;
		current: string | null;
		paused: boolean;
		queue: number;
		node: string;
	}[];
};

export type CronTaskInfo = {
	name: string;
	schedule: string;
	isRunning: boolean;
	lastRun: number | null;
	lastDuration: number | null;
	lastError: string | null;
	nextRun: number;
};

export type MigrationInfo = { id: string; description: string; appliedAt: number | null };

export type BlacklistEntry = {
	type: "user" | "guild";
	id: string;
	name: string | null;
	reason: string | null;
	createdAt: number;
};

export type CommandStats = {
	days: number;
	total: number;
	daily: { day: string; count: number }[];
	commands: { command: string; count: number }[];
};

export type LogLine = { time: number; level: string; text: string };
