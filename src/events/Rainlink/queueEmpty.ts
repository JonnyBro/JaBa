import { randomNum } from "@/helpers/functions.js";
import logger from "@/helpers/logger.js";
import { RainlinkPlayerCustom } from "@/types.js";
import useClient from "@/utils/use-client.js";
import { RainlinkQueue } from "rainlink";

const client = useClient();
const debug = !client.configService.get<boolean>("production");

export const data = {
	name: "queueEmpty",
	player: true,
	once: false,
};

export async function run(player: RainlinkPlayerCustom, queue: RainlinkQueue) {
	if (!player) return;

	const guild = client.guilds.cache.get(player.guildId);
	if (!guild) return;

	if (player.message?.deletable) await player.message.delete().catch(() => {});

	const guildData = await client.getGuildData(player.guildId);

	if (guildData.plugins?.music?.autoPlay) {
		const track = player.queue.previous[0];
		if (!track) return;

		let trackRadioLink;
		if (track.source === "youtube") {
			const id = track.identifier;
			trackRadioLink = `https://music.youtube.com/watch?v=${id}&list=RD${id}`;
		} else {
			const tracks = (
				await client.rainlink.search(track.title, {
					engine: "youtube",
				})
			).tracks;
			const id = tracks[randomNum(0, tracks.length)].identifier;
			trackRadioLink = `https://music.youtube.com/watch?v=${id}&list=RD${id}`;
		}

		const res = await client.rainlink.search(trackRadioLink, {
			requester: track.requester,
			engine: "youtube",
		});

		if (!res || !res.tracks) {
			if (debug) {
				logger.debug(`Autoplay ended in ${guild.name} (${guild.id}), no tracks found`);
			}

			return await player.stop(true);
		}

		const isPlaylist = res.type === "PLAYLIST";

		if (isPlaylist) for (const track of res.tracks) queue.add(track);
		else queue.add(res.tracks[0]);

		if (!player.playing) await player.play();
	} else await player.stop(true);
}
