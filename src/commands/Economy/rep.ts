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

	const toWait = Math.floor((Date.now() + 12 * 60 * 60 * 1000) / 1000); // 12 hours
	if (!userData.cooldowns) userData.cooldowns = { rep: 0 };

	userData.cooldowns.rep = toWait;

	const otherUserData = await client.getUserData(user.id);

	otherUserData.rep++;

	if (!otherUserData.achievements.rep.achieved) {
		otherUserData.achievements.rep.progress.now =
			otherUserData.rep > otherUserData.achievements.rep.progress.total
				? otherUserData.achievements.rep.progress.total
				: otherUserData.rep;
		if (
			otherUserData.achievements.rep.progress.now >=
			otherUserData.achievements.rep.progress.total
		) {
			otherUserData.achievements.rep.achieved = true;
			interaction.followUp({
				content: user.toString(),
				files: [
					{
						name: "achievement_unlocked6.png",
						attachment: "./assets/img/achievements/achievement_unlocked6.png",
					},
				],
			});
		}
	}

	await userData.save();
	await otherUserData.save();

	editReplySuccess(interaction, "economy/rep:SUCCESS", {
		user: user.toString(),
	});
};
