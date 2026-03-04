import { translateContext } from "@/helpers/functions.js";
import logger from "@/helpers/logger.js";
import { doAutoplay } from "@/helpers/music.js";
import { PlayerCustom } from "@/types.js";
import useClient from "@/utils/use-client.js";
import { Track, TrackExceptionEvent, UnresolvedTrack } from "lavalink-client";

const client = useClient();
const debug = !client.configService.get<boolean>("production");

export const data = {
	name: "trackError",
	player: true,
	once: false,
};

export async function run(player: PlayerCustom, track: Track | UnresolvedTrack | null, payload: TrackExceptionEvent) {
	if (!player) return;

	const guild = client.guilds.cache.get(player.guildId);
	if (!guild) return;

	if (player.message?.deletable) await player.message.delete().catch(() => {});

	if (debug)
		logger.debug(
			`[Lavalink] Error resolving track in ${guild.name} (${guild.id})
			Track: ${track?.info.title} (${track?.info.uri}). Payload:\n`,
			payload.error,
		);

	const channel = guild.channels.cache.get(player.textChannelId!);
	if (!channel?.isSendable()) return;

	const guildData = await client.getGuildData(guild.id);

	if (guildData.plugins.music.autoPlay) {
		channel.send({
			content: await translateContext(guild, "music/play:ERR_RESOLVING_QUEUE", {
				track: track?.info.title,
			}),
		});

		await doAutoplay(player);
		return await player.skip();
	} else {
		channel.send({
			content: await translateContext(guild, "music/play:ERR_RESOLVING_EMPTY", {
				track: track?.info.title,
			}),
		});

		return await player.destroy("track error", true);
	}
}
