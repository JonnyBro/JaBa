import packageJson from "@/../package.json" with { type: "json" };
import { APIEmbedFooter, ColorResolvable, EmbedBuilder, EmbedData } from "discord.js";
import useClient from "./use-client.js";

const client = useClient();
const prod = client.configService.get<boolean>("production");

const defaultFooter = client.configService.get<APIEmbedFooter>("embed.footer");
if (prod) defaultFooter.text += ` | ${packageJson.version}`;
const defaultColor = client.configService.get<ColorResolvable>("embed.color");

export const createEmbed = (data?: EmbedData) =>
	new EmbedBuilder({
		footer: typeof data?.footer === "object" ? data.footer : data?.footer ? { text: data.footer } : defaultFooter,
		...data,
	}).setColor(data?.color || defaultColor);
