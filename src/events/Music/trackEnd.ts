import logger from "@/helpers/logger.js";
import { PlayerCustom } from "@/types.js";
import useClient from "@/utils/use-client.js";
import { Track } from "lavalink-client";

const client = useClient();
const debug = !client.configService.get<boolean>("production");

export const data = {
	name: "trackEnd",
	player: true,
	once: false,
};

export async function run(player: PlayerCustom, track: Track | null) {
	if (!player) return;

	const guild = client.guilds.cache.get(player.guildId);
	if (!guild) return;

	if (player.message?.deletable) await player.message.delete().catch(() => {});
	if (debug)
		logger.debug(`[Lavalink] Track ${track?.info.title} (${track?.info.uri}) ended in ${guild.name} (${guild.id})`);
}
