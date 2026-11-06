import type { Block } from "@/helpers/message-blocks.js";
import useClient from "@/utils/use-client.js";
import { model, Schema } from "mongoose";

const client = useClient();

export const LEVEL_UP_MODES = ["reply", "channel", "off"] as const;
export type LevelUpMode = (typeof LEVEL_UP_MODES)[number];

export interface LevelReward {
	level: number;
	roleId: string | null;
	credits: number;
}

export interface LevelSettings {
	/** "reply" answers the message that got the level, "channel" posts to `channel` */
	mode: LevelUpMode;
	channel: string | null;
	/** Keep the roles of lower rewards, otherwise only the highest one stays */
	stack: boolean;
	rewards: LevelReward[];
}

export interface GreetingMessage {
	enabled: boolean;
	/** Unused for the DM greeting */
	channel: string | null;
	blocks: Block[];
	color: string | null;
	/** Shows the member's avatar next to the first text block */
	avatar: boolean;
}

export interface GreetingSettings {
	welcome: GreetingMessage;
	goodbye: GreetingMessage;
	dm: GreetingMessage;
	autoroles: string[];
}

export const WARN_ACTIONS = ["timeout", "kick", "ban"] as const;
export type WarnAction = (typeof WARN_ACTIONS)[number];

export interface WarnRule {
	/** Fires when the member reaches exactly this many active warns */
	count: number;
	action: WarnAction;
	/** Timeout length, only for "timeout" */
	minutes: number | null;
}

export interface WarnSettings {
	/** Warns older than this stop counting, 0 keeps them forever */
	expireDays: number;
	dm: boolean;
	rules: WarnRule[];
}

export const MODLOG_EVENTS = [
	"messageDelete",
	"messageEdit",
	"memberJoin",
	"memberLeave",
	"ban",
	"unban",
	"kick",
	"timeout",
	"nickname",
	"roles",
	"warns",
] as const;
export type ModLogEvent = (typeof MODLOG_EVENTS)[number];

export interface ModLogSettings {
	channel: string | null;
	events: Record<ModLogEvent, boolean>;
	/** Message logs skip these channels and threads inside them */
	ignoredChannels: string[];
}

export interface TicketSettings {
	/** Pinged when a ticket opens and count as ticket staff */
	supportRoles: string[];
	/** Gets open/close notes and transcripts */
	logChannel: string | null;
	transcriptDm: boolean;
}

export interface MusicSettings {
	/** When set, only DJs, server managers and a lone listener can control the player */
	djRole: string | null;
	/** 24/7: stay in the voice channel after the queue ends or everyone leaves */
	stay: boolean;
}

export interface GuildPlugins {
	birthdays: string | null;
	levels: LevelSettings;
	greetings: GreetingSettings;
	warns: WarnSettings;
	modlog: ModLogSettings;
	tickets: TicketSettings;
	music: MusicSettings;
}

export interface IGuildSchema {
	id: string;
	language: string;
	plugins: GuildPlugins;
}

const levelRewardSchema = new Schema<LevelReward>(
	{
		level: { type: Number, required: true, min: 1 },
		roleId: { type: String, default: null },
		credits: { type: Number, default: 0, min: 0 },
	},
	{ _id: false },
);

const levelsSchema = new Schema<LevelSettings>(
	{
		mode: { type: String, enum: LEVEL_UP_MODES, default: "reply" },
		channel: { type: String, default: null },
		stack: { type: Boolean, default: true },
		rewards: { type: [levelRewardSchema], default: [] },
	},
	{ _id: false },
);

const greetingMessageSchema = new Schema<GreetingMessage>(
	{
		enabled: { type: Boolean, default: false },
		channel: { type: String, default: null },
		blocks: { type: Schema.Types.Mixed, default: () => [] },
		color: { type: String, default: null },
		avatar: { type: Boolean, default: true },
	},
	{ _id: false, minimize: false },
);

const greetingsSchema = new Schema<GreetingSettings>(
	{
		welcome: { type: greetingMessageSchema, default: () => ({}) },
		goodbye: { type: greetingMessageSchema, default: () => ({}) },
		dm: { type: greetingMessageSchema, default: () => ({}) },
		autoroles: { type: [String], default: [] },
	},
	{ _id: false },
);

const warnRuleSchema = new Schema<WarnRule>(
	{
		count: { type: Number, required: true, min: 1 },
		action: { type: String, enum: WARN_ACTIONS, required: true },
		minutes: { type: Number, default: null },
	},
	{ _id: false },
);

const warnsSchema = new Schema<WarnSettings>(
	{
		expireDays: { type: Number, default: 0, min: 0 },
		dm: { type: Boolean, default: true },
		rules: { type: [warnRuleSchema], default: [] },
	},
	{ _id: false },
);

const modlogSchema = new Schema<ModLogSettings>(
	{
		channel: { type: String, default: null },
		events: {
			type: new Schema(
				Object.fromEntries(MODLOG_EVENTS.map(event => [event, { type: Boolean, default: true }])),
				{ _id: false },
			),
			default: () => ({}),
		},
		ignoredChannels: { type: [String], default: [] },
	},
	{ _id: false },
);

const ticketsSchema = new Schema<TicketSettings>(
	{
		supportRoles: { type: [String], default: [] },
		logChannel: { type: String, default: null },
		transcriptDm: { type: Boolean, default: false },
	},
	{ _id: false },
);

const musicSchema = new Schema<MusicSettings>(
	{
		djRole: { type: String, default: null },
		stay: { type: Boolean, default: false },
	},
	{ _id: false },
);

const pluginsSchema = new Schema(
	{
		birthdays: { type: String, default: null },
		levels: { type: levelsSchema, default: () => ({}) },
		greetings: { type: greetingsSchema, default: () => ({}) },
		warns: { type: warnsSchema, default: () => ({}) },
		modlog: { type: modlogSchema, default: () => ({}) },
		tickets: { type: ticketsSchema, default: () => ({}) },
		music: { type: musicSchema, default: () => ({}) },
	},
	{ _id: false },
);

const guildSchema = new Schema<IGuildSchema>({
	id: { type: String, required: true },
	language: {
		type: String,
		default: () => client.configService.get<string>("DEFAULT_LANG"),
	},
	plugins: { type: pluginsSchema, default: () => ({}) },
});

export default model<IGuildSchema>("Guild", guildSchema);
