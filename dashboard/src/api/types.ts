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

export type GuildInfo = {
	id: string;
	name: string;
	icon: string | null;
	memberCount: number;
	embedColor: string | null;
	canManage: boolean;
};

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
	moderation: Record<ModerationAction, boolean> & { warn: boolean };
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

export type MusicLyrics = {
	source: string;
	/** With timed lines `lines` is filled, otherwise only `text` */
	synced: boolean;
	lines: { time: number; text: string }[];
	text: string | null;
} | null;

export type PlayerAction = "pause" | "back" | "skip" | "stop" | "loop" | "shuffle" | "autoplay";

export type SearchSource = "ytm" | "yt" | "ym" | "sp" | "sc";

export type PlaylistTrack = Omit<MusicTrack, "requester"> & {
	file: { expired: boolean; expiresAt: string | null } | null;
};

export type PlaylistSummary = {
	id: string;
	name: string;
	trackCount: number;
	duration: number;
	artworkUrl: string | null;
	updatedAt: string;
};

export type Playlist = PlaylistSummary & { tracks: PlaylistTrack[] };

export type PlaylistList = {
	max: number;
	maxTracks: number;
	storage: { used: number; max: number };
	extensions: string[];
	items: PlaylistSummary[];
};

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

export type ShopItemType = "role" | "temp_role" | "item" | "consumable";
export type ShopEffect = "robShield" | "workBoost";

export type ShopItemInput = {
	name: string;
	description: string;
	emoji: string | null;
	type: ShopItemType;
	price: number;
	roleId: string | null;
	durationHours: number | null;
	effect: ShopEffect | null;
	stock: number | null;
	perUserLimit: number | null;
	requiredLevel: number;
	sellable: boolean;
	enabled: boolean;
};

export type ShopItem = ShopItemInput & { id: string };

export type GuildRole = { id: string; name: string; color: string };

export type TicketSettings = { supportRoles: string[]; logChannel: string | null; transcriptDm: boolean };

export type GuildTickets = { settings: TicketSettings; roles: GuildRole[] };

export type GuildShop = { items: ShopItem[]; roles: GuildRole[]; effects: ShopEffect[]; max: number };

export type LevelUpMode = "reply" | "channel" | "off";

export type LevelReward = { level: number; roleId: string | null; credits: number };

export type LevelSettings = { mode: LevelUpMode; channel: string | null; stack: boolean; rewards: LevelReward[] };

export type GuildLevels = LevelSettings & { roles: GuildRole[] };

export type GreetingKind = "welcome" | "goodbye" | "dm";

export type GreetingMessage = {
	enabled: boolean;
	channel: string | null;
	blocks: MessageBlock[];
	color: string | null;
	avatar: boolean;
};

export type GreetingSettings = Record<GreetingKind, GreetingMessage> & { autoroles: string[] };

export type GuildGreetings = GreetingSettings & { roles: GuildRole[] };

export type Giveaway = {
	id: string;
	prize: string;
	channelId: string;
	url: string | null;
	hostId: string;
	winners: number;
	credits: number;
	itemId: string | null;
	requiredLevel: number;
	requiredRoleId: string | null;
	participants: number;
	winnerIds: string[];
	endsAt: number;
	ended: boolean;
};

export type GiveawayInput = {
	channelId: string;
	prize: string;
	minutes: number;
	winners: number;
	credits: number;
	itemId: string | null;
	requiredLevel: number;
	requiredRoleId: string | null;
};

export type GuildGiveaways = {
	giveaways: Giveaway[];
	items: { id: string; name: string }[];
	roles: GuildRole[];
};

export type WarnAction = "timeout" | "kick" | "ban";

export type WarnRule = { count: number; action: WarnAction; minutes: number | null };

export type WarnSettings = { expireDays: number; dm: boolean; rules: WarnRule[] };

export type Warn = {
	id: string;
	shortId: string;
	userId: string;
	userName: string | null;
	userAvatar: string | null;
	moderatorId: string;
	moderatorName: string | null;
	reason: string | null;
	createdAt: number;
	removed: boolean;
	active: boolean;
};

export type GuildWarns = { settings: WarnSettings; recent: Warn[] };

export const MODLOG_EVENTS = [
	"messageDelete",
	"messageEdit",
	"memberJoin",
	"memberLeave",
	"nickname",
	"roles",
	"ban",
	"unban",
	"kick",
	"timeout",
	"warns",
] as const;

export type ModLogEvent = (typeof MODLOG_EVENTS)[number];

export type ModLogSettings = {
	channel: string | null;
	events: Record<ModLogEvent, boolean>;
	ignoredChannels: string[];
};

export type GuildModLog = { settings: ModLogSettings; canViewAuditLog: boolean };
