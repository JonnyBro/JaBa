import { IS_PROD } from "@/constants/index.js";
import logger from "@/helpers/logger.js";
import { doAutoplay } from "@/helpers/music.js";
import { PlayerCustom } from "@/types.js";
import useClient from "@/utils/use-client.js";

const client = useClient();
const debug = !IS_PROD;

export const data = {
	name: "queueEnd",
	player: true,
	once: false,
};

export async function run(player: PlayerCustom) {
	if (!player) return;

	const guild = client.guilds.cache.get(player.guildId);
	if (!guild) return;

	if (player.message?.deletable) await player.message.delete().catch(() => {});
	if (debug) logger.debug(`[Lavalink] Queue ended in ${guild.name} (${guild.id})`);

	const guildData = await client.getGuildData(player.guildId);

	if (guildData.plugins.music.autoPlay) doAutoplay(player);
	else await player.destroy("queue ended", true);
}
