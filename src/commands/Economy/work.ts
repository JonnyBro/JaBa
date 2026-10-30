import { claimCooldown, cooldownTime, formatCredits } from "@/helpers/economy.js";
import {
	editReplyError,
	editReplySuccess,
	getLocalizedDesc,
	randomNum,
	translateContext,
} from "@/helpers/functions.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import useClient from "@/utils/use-client.js";
import { ApplicationIntegrationType, InteractionContextType } from "discord.js";

const client = useClient();

const COOLDOWN = 60 * 60 * 1000;
const MIN_PAY = 100;
const MAX_PAY = 300;
const JOBS = 8;

export const data: CommandData = {
	name: "work",
	...getLocalizedDesc("economy/work:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	options: [],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply();

	const memberData = await client.getMemberData(interaction.guildId!, interaction.user.id);
	const pay = randomNum(MIN_PAY, MAX_PAY);
	const label = await translateContext(interaction, "economy/work:TRANSACTION");

	const claimed = await claimCooldown(memberData, "work", Date.now() + COOLDOWN, {
		$inc: { money: pay },
		$push: { transactions: { user: label, amount: pay, date: Date.now(), type: "got" } },
	});

	if (!claimed)
		return editReplyError(interaction, "economy/work:COOLDOWN", { time: cooldownTime(memberData.cooldowns.work) });

	await editReplySuccess(interaction, `economy/work:JOB_${randomNum(1, JOBS)}`, {
		credits: await formatCredits(interaction, pay),
	});
};
