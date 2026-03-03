import useClient from "@/utils/use-client.js";
import { model, Schema } from "mongoose";

const client = useClient();

export interface GuildPlugins {
	birthdays: string | false;
	music: {
		autoPlay: boolean;
	};
}

export interface IGuildSchema {
	id: string;
	language: string;
	plugins: GuildPlugins;
}

const musicSchema = new Schema(
	{
		autoPlay: { type: Boolean, default: false },
	},
	{ _id: false },
);

const pluginsSchema = new Schema(
	{
		birthdays: { type: String, default: false },
		music: { type: musicSchema, default: () => ({}) },
	},
	{ _id: false },
);

const guildSchema = new Schema<IGuildSchema>({
	id: { type: String, required: true },
	language: {
		type: String,
		default: () => client.configService.get<string>("defaultLang"),
	},
	plugins: { type: pluginsSchema, default: () => ({}) },
});

guildSchema.pre("validate", function (next) {
	const defaultLang = client.configService.get<string>("defaultLang");

	if (typeof this.language !== "string") this.language = defaultLang;

	this.plugins = {
		birthdays: typeof this.plugins?.birthdays === "string" ? this.plugins.birthdays : false,
		music: {
			autoPlay: !!this.plugins?.music?.autoPlay,
		},
	};

	next();
});

export default model<IGuildSchema>("Guild", guildSchema);
