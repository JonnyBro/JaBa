import { translateContext } from "@/helpers/functions.js";
import logger from "@/helpers/logger.js";
import { RainlinkPlayerCustom } from "@/types.js";
import useClient from "@/utils/use-client.js";

const client = useClient();
const debug = !client.configService.get("production");

export const data = {
	name: "trackStuck",
	player: true,
};

export async function run(player: RainlinkPlayerCustom, data: Record<string, any>) {
	if (!player) return;

	const guild = client.guilds.cache.get(player.guildId);
	if (!guild) return;

	if (player.message) await player.message.delete().catch(() => {});

	if (debug) logger.debug(`Track got stuck in ${guild.name} (${guild.id})\nData:`, data);

	const channel = guild.channels.cache.get(player.textId);
	if (!channel?.isSendable()) return;

	if (!player.queue.isEmpty) {
		channel.send({
			content: await translateContext(guild, "music/play:ERR_STUCK_QUEUE"),
		});

		return await player.skip();
	} else {
		channel.send({
			content: await translateContext(guild, "music/play:ERR_STUCK_EMPTY"),
		});

		return await player.stop(true);
	}
}
