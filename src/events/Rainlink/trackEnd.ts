import logger from "@/helpers/logger.js";
import { RainlinkPlayerCustom } from "@/types.js";
import useClient from "@/utils/use-client.js";

const client = useClient();
const debug = !client.configService.get("production");

export const data = {
	name: "trackEnd",
	player: true,
};

export async function run(player: RainlinkPlayerCustom) {
	if (!player) return;

	const guild = client.guilds.cache.get(player.guildId);
	if (!guild) return;

	if (player.message) await player.message.delete().catch(() => {});
	if (debug) logger.debug(`Track ended in ${guild.name} (${guild.id})`);
}
