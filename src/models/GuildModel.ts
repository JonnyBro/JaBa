import useClient from "@/utils/use-client.js";
import { model, Schema } from "mongoose";

const client = useClient();

export interface GuildPlugins {
	birthdays: string | false;
}

export interface IGuildSchema {
	id: string;
	language: string;
	plugins: GuildPlugins;
}

const pluginsSchema = new Schema(
	{
		birthdays: { type: String, default: false },
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

guildSchema.pre("validate", function (next) {
	const defaultLang = client.configService.get<string>("DEFAULT_LANG");

	if (typeof this.language !== "string") this.language = defaultLang;

	this.plugins = {
		birthdays: typeof this.plugins?.birthdays === "string" ? this.plugins.birthdays : false,
	};

	next();
});

export default model<IGuildSchema>("Guild", guildSchema);
