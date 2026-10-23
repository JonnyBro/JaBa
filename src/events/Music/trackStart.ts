import { translateContext } from "@/helpers/functions.js";
import logger from "@/helpers/logger.js";
import {
	getControllablePlayer,
	MUSIC_CONTROL_ID,
	PlayerAction,
	runPlayerAction,
	TRACK_CHANGING_ACTIONS,
	sendNowPlaying,
	updateNowPlaying,
} from "@/helpers/music.js";
import { savePlayerState } from "@/helpers/music-resume.js";
import { componentRouter } from "@/utils/component-router.js";
import { MessageFlags } from "discord.js";
import { Player, Track } from "lavalink-client";

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

	const action = interaction.customId.split(":")[1] as PlayerAction;

	await interaction.deferUpdate();

	try {
		const notice = await runPlayerAction(player, action);

		if (!TRACK_CHANGING_ACTIONS.includes(action)) await updateNowPlaying(player);

		if (notice)
			await interaction.followUp({
				content: await translateContext(interaction, notice),
				flags: MessageFlags.Ephemeral,
			});
	} catch (e) {
		logger.error(`[Lavalink] Error handling "${action}" button:`, e);
	}
});
