import logger from "@/helpers/logger.js";
import { RainlinkPlayerCustom } from "@/types.js";
import useClient from "@/utils/use-client.js";

const client = useClient();
const debug = !client.configService.get<boolean>("production");

export const data = {
	name: "trackEnd",
	player: true,
	once: false,
};

export async function run(player: RainlinkPlayerCustom) {
	if (!player) return;

	const guild = client.guilds.cache.get(player.guildId);
	if (!guild) return;

	if (player.message?.deletable) await player.message.delete().catch(() => {});
	if (debug) logger.debug(`Track ended in ${guild.name} (${guild.id})`);
}
