import { claimCooldown, cooldownTime, formatCredits } from "@/helpers/economy.js";
import { PROJECT_ROOT } from "@/constants/index.js";
import { editReplyError, formatReply, getLocalizedDesc, randomNum, translateContext } from "@/helpers/functions.js";
import { hasEffect } from "@/helpers/shop.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import useClient from "@/utils/use-client.js";
import { ApplicationIntegrationType, AttachmentBuilder, InteractionContextType } from "discord.js";
import { join } from "path";

const client = useClient();

const COOLDOWN = 60 * 60 * 1000;
const FORM_COOLDOWN = 30 * 1000;
const MIN_PAY = 100;
const MAX_PAY = 300;
const BOOST_MULTIPLIER = 2;
const JOBS = 8;
const APPLICATION_FORM = join(PROJECT_ROOT, "assets", "job-application.webp");

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

	if (!memberData.cooldowns.work) {
		const claimed = await claimCooldown(memberData, "work", Date.now() + FORM_COOLDOWN);
		if (claimed)
			return interaction.editReply({
				content: await translateContext(interaction, "economy/work:FIRST_SHIFT"),
				files: [new AttachmentBuilder(APPLICATION_FORM, { name: "job-application.webp" })],
			});
	}

	const boosted = hasEffect(memberData, "workBoost");
	const pay = randomNum(MIN_PAY, MAX_PAY) * (boosted ? BOOST_MULTIPLIER : 1);
	const label = await translateContext(interaction, "economy/work:TRANSACTION");

	const claimed = await claimCooldown(memberData, "work", Date.now() + COOLDOWN, {
		$inc: { money: pay },
		$push: { transactions: { user: label, amount: pay, date: Date.now(), type: "got" } },
	});

	if (!claimed) {
		const { cooldowns } = await client.getMemberData(interaction.guildId!, interaction.user.id);
		return editReplyError(interaction, "economy/work:COOLDOWN", { time: cooldownTime(cooldowns.work) });
	}

	const content = await translateContext(interaction, `economy/work:JOB_${randomNum(1, JOBS)}`, {
		credits: await formatCredits(interaction, pay),
	});
	const boost = boosted ? `\n-# ⚡ ${await translateContext(interaction, "economy/work:BOOSTED")}` : "";

	await interaction.editReply({ content: `${formatReply(content, "success")}${boost}` });
};
