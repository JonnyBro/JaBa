import useClient from "@/utils/use-client.js";
import { model, Schema } from "mongoose";

const client = useClient();

export interface GuildPlugins {
	birthdays: string | null;
}

export interface IGuildSchema {
	id: string;
	language: string;
	plugins: GuildPlugins;
}

const pluginsSchema = new Schema(
	{
		birthdays: { type: String, default: null },
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
