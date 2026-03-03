import { randomNum } from "@/helpers/functions.js";
import logger from "@/helpers/logger.js";
import { PlayerCustom } from "@/types.js";
import useClient from "@/utils/use-client.js";

const client = useClient();
const debug = !client.configService.get<boolean>("production");

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
	if (debug) logger.debug(`Queue ended in ${guild.name} (${guild.id})`);

	const guildData = await client.getGuildData(player.guildId);

	if (guildData.plugins?.music?.autoPlay) {
		if (debug) logger.debug(`Starting autoplay in ${guild.name} (${guild.id})`);

		const track = player.queue.previous[0];
		if (!track) return await player.destroy("queue ended", true);

		let trackRadioLink;
		if (track.info.sourceName === "youtube") {
			const id = track.info.identifier;
			trackRadioLink = `https://music.youtube.com/watch?v=${id}&list=RD${id}`;
		} else {
			const tracks = (await player.search(track.info.title, client.user)).tracks;
			const id = tracks[randomNum(0, tracks.length)].info.identifier;
			trackRadioLink = `https://music.youtube.com/watch?v=${id}&list=RD${id}`;
		}

		const res = await player.search(trackRadioLink, client.user);

		if (!res || !res.tracks) {
			if (debug) logger.debug(`Autoplay ended in ${guild.name} (${guild.id}), no tracks found`);

			return await player.destroy("autoplay ended", true);
		}

		const isPlaylist = res.loadType === "playlist";

		if (isPlaylist) for (const track of res.tracks) player.queue.add(track);
		else player.queue.add(res.tracks[0]);

		if (!player.connected) await player.connect();
		if (!player.playing) await player.play();
	} else await player.destroy("queue ended", true);
}