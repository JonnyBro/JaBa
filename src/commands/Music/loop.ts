import { editReplyError, editReplySuccess, getLocalizedDesc } from "@/helpers/functions.js";
import { getControllablePlayer, updateNowPlaying } from "@/helpers/music.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import useClient from "@/utils/use-client.js";
import { ApplicationCommandOptionType, ApplicationIntegrationType, InteractionContextType } from "discord.js";
import { RepeatMode } from "lavalink-client";

const client = useClient();

export const data: CommandData = {
	name: "loop",
	...getLocalizedDesc("music/loop:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	options: [
		{
			name: "mode",
			...getLocalizedDesc("music/loop:MODE"),
			type: ApplicationCommandOptionType.String,
			required: true,
			choices: (["queue", "track", "off"] as const).map(mode => ({
				name: client.i18n.translate(`music/loop:MODE_${mode.toUpperCase()}`),
				// eslint-disable-next-line camelcase
				name_localizations: {
					ru: client.i18n.translate(`music/loop:MODE_${mode.toUpperCase()}`, { lng: "ru-RU" }),
				},
				value: mode,
			})),
		},
	],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply();

	const { player, error } = getControllablePlayer(interaction);
	if (!player) return editReplyError(interaction, error!);

	const mode = interaction.options.getString("mode", true) as RepeatMode;

	await player.setRepeatMode(mode);
	await updateNowPlaying(player);

	await editReplySuccess(interaction, `music/loop:SUCCESS_${mode.toUpperCase()}`);
};
