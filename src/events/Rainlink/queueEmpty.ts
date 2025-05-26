import { randomNum } from "@/helpers/functions.js";
import logger from "@/helpers/logger.js";
import { RainlinkPlayerCustom } from "@/types.js";
import useClient from "@/utils/use-client.js";
import { RainlinkQueue } from "rainlink";

const client = useClient();
const debug = !client.configService.get("production");

export const data = {
	name: "queueEmpty",
	player: true,
};

export async function run(player: RainlinkPlayerCustom, queue: RainlinkQueue) {
	if (!player) return;

	const guild = client.guilds.cache.get(player.guildId);
	if (!guild) return;

	if (player.message) await player.message.delete().catch(() => {});

	const guildData = await client.getGuildData(player.guildId);

	if (guildData.plugins.music.autoPlay) {
		const track = player.queue.previous[0];
		if (!track) return;

		const trackRadioLink = track.source === "youtube" ? `https://music.youtube.com/watch?v=${
			track.identifier
		}&list=RD${track.identifier}` : track.title;
		const res = await client.rainlink.search(trackRadioLink, {
			requester: track.requester,
			engine: "youtube",
		});

		if (!res || !res.tracks) {
			if (debug) {
				logger.debug(`Autoplay ended in ${guild.name} (${guild.id}), no tracks found`);
			}

			await player.stop(false);
		}

		const randomTrack = res.tracks[randomNum(0, res.tracks.length)];

		queue.add(randomTrack);

		if (!player.playing) await player.play();
	} else {
		await player.destroy();
	}
}
