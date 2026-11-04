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
	logChannel: string | null;
	dm: boolean;
	rules: WarnRule[];
}

export interface GuildPlugins {
	birthdays: string | null;
	levels: LevelSettings;
	greetings: GreetingSettings;
	warns: WarnSettings;
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
		logChannel: { type: String, default: null },
		dm: { type: Boolean, default: true },
		rules: { type: [warnRuleSchema], default: [] },
	},
	{ _id: false },
);

const pluginsSchema = new Schema(
	{
		birthdays: { type: String, default: null },
		levels: { type: levelsSchema, default: () => ({}) },
		greetings: { type: greetingsSchema, default: () => ({}) },
		warns: { type: warnsSchema, default: () => ({}) },
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
