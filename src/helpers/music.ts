import { PlayerCustom } from "@/types.js";
import useClient from "@/utils/use-client.js";
import { GuildMember } from "discord.js";
import { randomNum } from "./functions.js";
import logger from "./logger.js";

const client = useClient();
const debug = !client.configService.get<boolean>("production");

export const addToQueue = async (
	guildId: string,
	textChannelId: string,
	voiceChannelId: string,
	member: GuildMember | null,
	query: string,
) => {
	const player =
		client.lavalink.getPlayer(guildId) ||
		client.lavalink.createPlayer({
			guildId,
			textChannelId,
			voiceChannelId,
			volume: 100,
			selfDeaf: true,
		});

	const res = await player.search(query, member || client.user);

	if (!res || !res.tracks.length) return null;

	player.queue.add(res.tracks);

	if (!player.connected) await player.connect();
	if (!player.playing) await player.play();

	return res;
};

export const doAutoplay = async (player: PlayerCustom) => {
	const guildName = client.guilds.cache.get(player.guildId)?.name;
	const guildId = player.guildId;

	if (debug) logger.debug(`[Lavalink] Starting autoplay in ${guildName} (${guildId})`);

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

	await addToQueue(guildId, player.textChannelId!, player.voiceChannelId!, null, trackRadioLink);
};
