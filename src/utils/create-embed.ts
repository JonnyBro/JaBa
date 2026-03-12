import packageJson from "@/../package.json" with { type: "json" };
import { IS_PROD } from "@/constants/index.js";
import { APIEmbedFooter, ColorResolvable, EmbedBuilder, EmbedData } from "discord.js";
import useClient from "./use-client.js";

const client = useClient();
const debug = !IS_PROD;

const defaultFooter: APIEmbedFooter = {
	text: client.configService.get<string>("EMBED_FOOTER"),
};
if (!debug) defaultFooter.text += ` | ${packageJson.version}`;

const defaultColor = client.configService.get<ColorResolvable>("EMBED_COLOR");

export const createEmbed = (data?: EmbedData) =>
	new EmbedBuilder({
		footer: typeof data?.footer === "object" ? data.footer : data?.footer ? { text: data.footer } : defaultFooter,
		...data,
	}).setColor(data?.color || defaultColor);
