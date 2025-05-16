import { editReplyError, editReplySuccess, getLocalizedDesc } from "@/helpers/functions.js";
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
			name: "text",
			...getLocalizedDesc("economy/profile:BIO"),
			type: ApplicationCommandOptionType.String,
			required: true,
		},
		{
			name: "ephemeral",
			type: ApplicationCommandOptionType.Boolean,
			...getLocalizedDesc("misc:EPHEMERAL_RESPONSE"),
		},
	],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply({
		flags: interaction.options.getBoolean("ephemeral") ? MessageFlags.Ephemeral : undefined,
	});

	const userData = await client.getUserData(interaction.user.id);
	const newBio = interaction.options.getString("text", true);
	if (newBio.length > 150) return editReplyError(interaction, "misc:MAX_150_CHARS");

	// escape the 'escape' characters and add a zero width space to mentions so they don't work
	userData.bio = escapeEscape(newBio).replace("@", "@\u200b");

	await userData.save();

	editReplySuccess(interaction, "economy/setbio:SUCCESS");
};
