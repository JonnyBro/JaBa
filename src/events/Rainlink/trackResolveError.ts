import { translateContext } from "@/helpers/functions.js";
import logger from "@/helpers/logger.js";
import { RainlinkPlayerCustom } from "@/types.js";
import useClient from "@/utils/use-client.js";
import { RainlinkTrack } from "rainlink";

const client = useClient();
const debug = !client.configService.get<boolean>("production");

export const data = {
	name: "trackResolveError",
	player: true,
};

export async function run(player: RainlinkPlayerCustom, track: RainlinkTrack, message: string) {
	if (!player) return;

	const guild = client.guilds.cache.get(player.guildId);
	if (!guild) return;

	if (player.message) await player.message.delete().catch(() => {});

	if (debug) {
		logger.debug(
			`Track resolve error in ${guild.name} (${guild.id})\nTrack: ${
				track.title
			} (${track.uri})`,
			message,
		);
	}

	const channel = guild.channels.cache.get(player.textId);
	if (!channel?.isSendable()) return;

	if (!player.queue.isEmpty) {
		channel.send({
			content: await translateContext(guild, "music/play:ERR_RESOLVING_QUEUE", {
				track: track.title,
			}),
		});

		return await player.skip();
	} else {
		channel.send({
			content: await translateContext(guild, "music/play:ERR_RESOLVING_EMPTY", {
				track: track.title,
			}),
		});

		return await player.stop(true);
	}
}
