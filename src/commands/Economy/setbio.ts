import { editReplySuccess, formatString, getLocalizedDesc } from "@/helpers/functions.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import useClient from "@/utils/use-client.js";
import {
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	escapeEscape,
	InteractionContextType,
	MessageFlags,
} from "discord.js";

const client = useClient();

export const data: CommandData = {
	name: "setbio",
	...getLocalizedDesc("economy/setbio:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [
		ApplicationIntegrationType.GuildInstall,
		ApplicationIntegrationType.UserInstall,
	],
	contexts: [InteractionContextType.Guild, InteractionContextType.PrivateChannel],
	options: [
		{
			name: "clear",
			...getLocalizedDesc("economy/setbio:CLEAR"),
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "ephemeral",
					type: ApplicationCommandOptionType.Boolean,
					...getLocalizedDesc("misc:EPHEMERAL_RESPONSE"),
				},
			],
		},
		{
			name: "set",
			...getLocalizedDesc("economy/setbio:SET"),
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "text",
					type: ApplicationCommandOptionType.String,
					...getLocalizedDesc("economy/setbio:TEXT"),
					required: true,
				},
				{
					name: "ephemeral",
					type: ApplicationCommandOptionType.Boolean,
					...getLocalizedDesc("misc:EPHEMERAL_RESPONSE"),
				},
			],
		},
	],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply({
		flags: interaction.options.getBoolean("ephemeral") ? MessageFlags.Ephemeral : undefined,
	});

	const subcommand = interaction.options.getSubcommand();
	const userData = await client.getUserData(interaction.user.id);

	switch (subcommand) {
		case "clear":
			userData.set("bio", null);

			await userData.save();

			return editReplySuccess(interaction, "economy/setbio:SUCCESS_CLEAR");

		case "set": {
			const bio = formatString(interaction.options.getString("text", true), 150);

			// escape the 'escape' characters and add a zero width space to mentions to disable them
			userData.set("bio", escapeEscape(bio).replace("@", "@\u200b"));

			await userData.save();

			return editReplySuccess(interaction, "economy/setbio:SUCCESS");
		}
	}
};
