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

export interface GuildPlugins {
	birthdays: string | null;
	levels: LevelSettings;
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

const pluginsSchema = new Schema(
	{
		birthdays: { type: String, default: null },
		levels: { type: levelsSchema, default: () => ({}) },
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
