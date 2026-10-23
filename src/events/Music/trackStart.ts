import { translateContext } from "@/helpers/functions.js";
import logger from "@/helpers/logger.js";
import {
	getControllablePlayer,
	isAutoplayEnabled,
	MAX_VOLUME,
	MUSIC_CONTROL_ID,
	sendNowPlaying,
	setAutoplay,
	updateNowPlaying,
} from "@/helpers/music.js";
import { savePlayerState } from "@/helpers/music-resume.js";
import { componentRouter } from "@/utils/component-router.js";
import { MessageFlags } from "discord.js";
import { Player, RepeatMode, Track } from "lavalink-client";

export const data = {
	name: "trackStart",
	player: true,
	once: false,
};

export async function run(player: Player, track: Track | null) {
	if (!track) return;

	logger.debug(`[Lavalink] Track started in ${player.guildId}: "${track.info.title}" (${track.info.uri})`);

	const message = await sendNowPlaying(player, track);
	await savePlayerState(player, message?.id);
}

const nextRepeatMode: Record<RepeatMode, RepeatMode> = {
	off: "track",
	track: "queue",
	queue: "off",
};

componentRouter.register(MUSIC_CONTROL_ID, async interaction => {
	if (!interaction.isButton()) return;

	const { player, error } = getControllablePlayer(interaction);

	if (!player) {
		await interaction.reply({
			content: await translateContext(interaction, error!),
			flags: MessageFlags.Ephemeral,
		});

		return;
	}

	const action = interaction.customId.split(":")[1];
	let notice: string | null = null;

	await interaction.deferUpdate();

	try {
		switch (action) {
			case "pause":
				if (player.paused) await player.resume();
				else await player.pause();
				break;

			case "back": {
				const previous = player.queue.previous[0];
				if (!previous) {
					notice = "music/back:NO_PREV_SONG";
					break;
				}

				await player.queue.previous.shift();
				await player.play({ clientTrack: previous });
				return;
			}

			case "skip":
				if (!player.queue.tracks.length && !isAutoplayEnabled(player)) {
					notice = "music/queue:NO_QUEUE";
					break;
				}

				if (player.queue.tracks.length) await player.skip();
				else await player.stopPlaying(false, true);
				return;

			case "stop":
				await player.destroy("stopped by user", true);
				return;

			case "voldown":
				await player.setVolume(Math.max(player.volume - 10, 0));
				break;

			case "volup":
				await player.setVolume(Math.min(player.volume + 10, MAX_VOLUME));
				break;

			case "loop":
				await player.setRepeatMode(nextRepeatMode[player.repeatMode]);
				break;

			case "shuffle":
				if (!player.queue.tracks.length) {
					notice = "music/queue:NO_QUEUE";
					break;
				}

				await player.queue.shuffle();
				notice = "music/shuffle:SUCCESS";
				break;

			case "autoplay":
				setAutoplay(player, !isAutoplayEnabled(player));
				break;
		}

		await updateNowPlaying(player);

		if (notice)
			await interaction.followUp({
				content: await translateContext(interaction, notice),
				flags: MessageFlags.Ephemeral,
			});
	} catch (e) {
		logger.error(`[Lavalink] Error handling "${action}" button:`, e);
	}
});
