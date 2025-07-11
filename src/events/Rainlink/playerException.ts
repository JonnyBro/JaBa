import { translateContext } from "@/helpers/functions.js";
import logger from "@/helpers/logger.js";
import { RainlinkPlayerCustom } from "@/types.js";
import useClient from "@/utils/use-client.js";

const client = useClient();
const debug = !client.configService.get<boolean>("production");

export const data = {
	name: "playerException",
	player: true,
};

export async function run(player: RainlinkPlayerCustom, data: Record<string, any>) {
	if (!player || !player.playing) return;

	const guild = client.guilds.cache.get(player.guildId);
	if (!guild) return;

	if (player.message) await player.message.delete().catch(() => {});

	if (debug) logger.debug(`Player in ${guild.name} (${guild.id}) got an exception\n`, data);

	const channel = guild.channels.cache.get(player.textId);
	if (!channel?.isSendable()) return;

	if (!player.queue.isEmpty) {
		channel.send({
			content: await translateContext(guild, "music/play:ERR_OCCURRED_QUEUE"),
		});

		return await player.skip();
	} else {
		channel.send({
			content: await translateContext(guild, "music/play:ERR_OCCURRED_EMPTY"),
		});

		return await player.stop(true);
	}
}
