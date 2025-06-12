import { EmbedBuilder, EmbedData } from "discord.js";
import useClient from "./use-client.js";

const client = useClient();

export const createEmbed = (data?: EmbedData) =>
	new EmbedBuilder({
		footer:
			typeof data?.footer === "object"
				? data.footer
				: data?.footer
					? { text: data.footer }
					: client.configService.get("embed.footer"),
		...data,
	}).setColor(data?.color || client.configService.get("embed.color"));
