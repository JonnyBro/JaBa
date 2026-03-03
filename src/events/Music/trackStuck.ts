import { translateContext } from "@/helpers/functions.js";
import logger from "@/helpers/logger.js";
import { PlayerCustom } from "@/types.js";
import useClient from "@/utils/use-client.js";
import { Track, TrackStuckEvent } from "lavalink-client";

const client = useClient();
const debug = !client.configService.get<boolean>("production");

export const data = {
	name: "trackStuck",
	player: true,
	once: false,
};

export async function run(player: PlayerCustom, _track: Track | null, payload: TrackStuckEvent) {
	if (!player) return;

	const guild = client.guilds.cache.get(player.guildId);
	if (!guild) return;

	if (player.message?.deletable) await player.message.delete().catch(() => {});

	if (debug) logger.debug(`Track got stuck in ${guild.name} (${guild.id})\npayload:`, payload);

	const channel = guild.channels.cache.get(player.textChannelId!);
	if (!channel?.isSendable()) return;

	// NOTE: reimplement autoplay
	if (player.queue.tracks.length) {
		channel.send({
			content: await translateContext(guild, "music/play:ERR_STUCK_QUEUE"),
		});

		return await player.skip();
	} else {
		channel.send({
			content: await translateContext(guild, "music/play:ERR_STUCK_EMPTY"),
		});

		return await player.destroy("track stuck", true);
	}
}
