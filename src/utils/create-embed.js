import { EmbedBuilder } from "discord.js";
import useClient from "../utils/use-client.js";
/**
 *
 * @param {import("discord.js").EmbedData} data - embed data
 * @returns The generated EmbedBuilder instance.
 */
export const createEmbed = data => {
	const client = useClient();
	return new EmbedBuilder({
		footer: typeof data.footer === "object" ? data.footer : data.footer ? { text: data.footer } : client.configService.get("embed.footer"),
		...data,
	}).setColor(data.color ?? client.configService.get("embed.color"));
};
