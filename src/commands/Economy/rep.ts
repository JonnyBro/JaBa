import { cooldownTime, giveRep } from "@/helpers/economy.js";
import { editReplyError, editReplySuccess, getLocalizedDesc } from "@/helpers/functions.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import { ApplicationCommandOptionType, ApplicationIntegrationType, InteractionContextType } from "discord.js";

export const data: CommandData = {
	name: "rep",
	...getLocalizedDesc("economy/rep:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall],
	contexts: [InteractionContextType.Guild, InteractionContextType.PrivateChannel],
	options: [
		{
			name: "user",
			...getLocalizedDesc("common:USER"),
			type: ApplicationCommandOptionType.User,
			required: true,
		},
	],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply();

	const user = interaction.options.getUser("user", true);
	if (user.bot) return editReplyError(interaction, "misc:BOT_USER");
	if (user.id === interaction.user.id) return editReplyError(interaction, "misc:CANT_YOURSELF");

	const { given, until } = await giveRep(interaction.user.id, user.id);
	if (!given) return editReplyError(interaction, "economy/rep:COOLDOWN", { time: cooldownTime(until) });

	await editReplySuccess(interaction, "economy/rep:SUCCESS", { user: user.toString() });
};
