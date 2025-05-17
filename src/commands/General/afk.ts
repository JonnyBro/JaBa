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
	name: "afk",
	...getLocalizedDesc("general/afk:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [
		ApplicationIntegrationType.GuildInstall,
		ApplicationIntegrationType.UserInstall,
	],
	contexts: [
		InteractionContextType.BotDM,
		InteractionContextType.Guild,
		InteractionContextType.PrivateChannel,
	],
	options: [
		{
			name: "message",
			...getLocalizedDesc("common:MESSAGE"),
			type: ApplicationCommandOptionType.String,
			required: true,
		},
		{
			name: "ephemeral",
			...getLocalizedDesc("misc:EPHEMERAL_RESPONSE"),
			type: ApplicationCommandOptionType.Boolean,
		},
	],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply({
		flags: interaction.options.getBoolean("ephemeral") ? MessageFlags.Ephemeral : undefined,
	});

	const userData = await client.getUserData(interaction.user.id);
	const message = interaction.options.getString("message", true);

	if (message.length > 150) return await editReplyError(interaction, "misc:MAX_150_CHARS");

	// escape the 'escape' characters and add a zero width space to mentions so they don't work
	userData.afk = escapeEscape(message).replace("@", "@\u200b");

	await userData.save();

	await editReplySuccess(interaction, "general/afk:SUCCESS", {
		message: userData.afk,
	});
};
