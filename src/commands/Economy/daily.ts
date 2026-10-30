import { claimCooldown, cooldownTime, formatCredits } from "@/helpers/economy.js";
import { editReplyError, editReplySuccess, getLocalizedDesc, translateContext } from "@/helpers/functions.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import useClient from "@/utils/use-client.js";
import { ApplicationIntegrationType, InteractionContextType } from "discord.js";

const client = useClient();

const DAY = 24 * 60 * 60 * 1000;
const BASE_REWARD = 500;
const STREAK_BONUS = 100;
const MAX_STREAK = 10;

export const data: CommandData = {
	name: "daily",
	...getLocalizedDesc("economy/daily:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	options: [],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply();

	const memberData = await client.getMemberData(interaction.guildId!, interaction.user.id);
	const nextClaim = memberData.cooldowns.daily;

	// The cooldown holds the time of the next claim, a day later than that the streak is lost
	const streak = nextClaim && Date.now() - nextClaim < DAY ? memberData.dailyStreak + 1 : 1;
	const reward = BASE_REWARD + STREAK_BONUS * (Math.min(streak, MAX_STREAK) - 1);
	const label = await translateContext(interaction, "economy/daily:TRANSACTION");

	const claimed = await claimCooldown(memberData, "daily", Date.now() + DAY, {
		$set: { dailyStreak: streak },
		$inc: { money: reward },
		$push: { transactions: { user: label, amount: reward, date: Date.now(), type: "got" } },
	});

	if (!claimed) return editReplyError(interaction, "economy/daily:COOLDOWN", { time: cooldownTime(nextClaim) });

	await editReplySuccess(interaction, streak >= MAX_STREAK ? "economy/daily:SUCCESS_MAX" : "economy/daily:SUCCESS", {
		credits: await formatCredits(interaction, reward),
		streak,
		next: await formatCredits(interaction, reward + (streak < MAX_STREAK ? STREAK_BONUS : 0)),
	});
};
