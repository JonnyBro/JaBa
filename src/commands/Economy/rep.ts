import { editReplyError, editReplySuccess, getLocalizedDesc } from "@/helpers/functions.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import useClient from "@/utils/use-client.js";
import {
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	InteractionContextType,
} from "discord.js";

const client = useClient();

export const data: CommandData = {
	name: "rep",
	...getLocalizedDesc("economy/rep:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [
		ApplicationIntegrationType.GuildInstall,
		ApplicationIntegrationType.UserInstall,
	],
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

	const userData = await client.getUserData(interaction.user.id);
	const isOnCooldown = userData.cooldowns.rep;

	if (isOnCooldown && isOnCooldown > Date.now()) {
		return editReplyError(interaction, "economy/rep:COOLDOWN", {
			time: `<t:${Math.floor(isOnCooldown / 1000)}:R>`,
		});
	}

	const user = interaction.options.getUser("user", true);
	if (user.bot) return editReplyError(interaction, "misc:BOT_USER");
	if (user.id === interaction.user.id) return editReplyError(interaction, "misc:CANT_YOURSELF");

	const toWait = Date.now() + 12 * 60 * 60 * 1000; // 12 hours
	const otherUserData = await client.getUserData(user.id);

	otherUserData.set("rep", otherUserData.rep + 1);
	userData.set("cooldowns.rep", toWait);

	await userData.save();
	await otherUserData.save();

	editReplySuccess(interaction, "economy/rep:SUCCESS", {
		user: user.toString(),
	});
};
