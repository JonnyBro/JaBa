import { editReplyError, editReplySuccess, getLocalizedDesc } from "@/helpers/functions.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import useClient from "@/utils/use-client.js";
import {
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	InteractionContextType,
} from "discord.js";
import { RainlinkLoopMode } from "rainlink";

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
			choices: [
				{ name: client.i18n.translate("music/loop:DISABLE"), value: "none" },
				{ name: client.i18n.translate("music/loop:TRACK"), value: "song" },
				{ name: client.i18n.translate("music/loop:QUEUE"), value: "queue" },
			],
		},
	],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply();

	const player = client.rainlink.players.get(interaction.guildId!);
	if (!player) return editReplyError(interaction, "music/play:NOT_PLAYING");

	const mode = interaction.options.getString("mode", true);

	player.setLoop(mode as RainlinkLoopMode);

	await editReplySuccess(interaction, `music/loop:SUCCESS_${mode.toUpperCase()}`);
};
