import { claimCooldown, cooldownTime, formatCredits, giveCredits, takeCredits } from "@/helpers/economy.js";
import {
	editReplyError,
	editReplySuccess,
	getLocalizedDesc,
	getUsername,
	randomNum,
	translateContext,
} from "@/helpers/functions.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import useClient from "@/utils/use-client.js";
import { ApplicationCommandOptionType, ApplicationIntegrationType, InteractionContextType } from "discord.js";

const client = useClient();

const COOLDOWN = 2 * 60 * 60 * 1000;
const SUCCESS_CHANCE = 40;
const MIN_TARGET_MONEY = 200;
const MIN_OWN_MONEY = 100;
const STEAL_PERCENT = [10, 25] as const;
const FINE_PERCENT = 15;
const MIN_FINE = 50;

export const data: CommandData = {
	name: "rob",
	...getLocalizedDesc("economy/rob:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
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

	const target = interaction.options.getUser("user", true);
	if (target.bot) return editReplyError(interaction, "misc:BOT_USER");
	if (target.id === interaction.user.id) return editReplyError(interaction, "misc:CANT_YOURSELF");

	const [robber, victim] = await Promise.all([
		client.getMemberData(interaction.guildId!, interaction.user.id),
		client.getMemberData(interaction.guildId!, target.id),
	]);

	if (robber.cooldowns.rob > Date.now())
		return editReplyError(interaction, "economy/rob:COOLDOWN", { time: cooldownTime(robber.cooldowns.rob) });
	if (robber.money < MIN_OWN_MONEY)
		return editReplyError(interaction, "economy/rob:TOO_POOR", {
			credits: await formatCredits(interaction, MIN_OWN_MONEY),
		});
	if (victim.money < MIN_TARGET_MONEY)
		return editReplyError(interaction, "economy/rob:TARGET_POOR", { user: target.toString() });

	if (!(await claimCooldown(robber, "rob", Date.now() + COOLDOWN)))
		return editReplyError(interaction, "economy/rob:COOLDOWN", { time: cooldownTime(Date.now() + COOLDOWN) });

	const t = (key: string, args?: Record<string, unknown>) => translateContext(interaction, key, args);

	if (randomNum(1, 100) <= SUCCESS_CHANCE) {
		const amount = Math.max(1, Math.floor((victim.money * randomNum(...STEAL_PERCENT)) / 100));

		// The victim could have spent the money between the check and now
		if (
			!(await takeCredits(
				victim,
				amount,
				await t("economy/rob:ROBBED_BY", { user: getUsername(interaction.user) }),
			))
		)
			return editReplyError(interaction, "economy/rob:ESCAPED", { user: target.toString() });

		await giveCredits(robber, amount, await t("economy/rob:ROBBED_FROM", { user: getUsername(target) }));

		return editReplySuccess(interaction, "economy/rob:SUCCESS", {
			user: target.toString(),
			credits: await formatCredits(interaction, amount),
		});
	}

	const fine = Math.min(robber.money, Math.max(MIN_FINE, Math.floor((robber.money * FINE_PERCENT) / 100)));

	if (await takeCredits(robber, fine, await t("economy/rob:FINE"))) {
		await giveCredits(victim, fine, await t("economy/rob:COMPENSATION", { user: getUsername(interaction.user) }));

		return editReplyError(interaction, "economy/rob:CAUGHT", {
			user: target.toString(),
			credits: await formatCredits(interaction, fine),
		});
	}

	await editReplyError(interaction, "economy/rob:CAUGHT_BROKE", { user: target.toString() });
};
