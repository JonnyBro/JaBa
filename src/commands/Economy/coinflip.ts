import { formatCredits, giveCredits, takeCredits } from "@/helpers/economy.js";
import { editReplyError, getLocalizedDesc, getUsername, randomNum, translateContext } from "@/helpers/functions.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import { componentRouter } from "@/utils/component-router.js";
import { createContainer, createText } from "@/utils/create-container.js";
import useClient from "@/utils/use-client.js";
import {
	ActionRowBuilder,
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	ButtonBuilder,
	ButtonStyle,
	Interaction,
	InteractionContextType,
	MessageFlags,
} from "discord.js";

const client = useClient();

const COINFLIP_ID = "ECO_COINFLIP";
const MIN_BET = 10;
const MAX_BET = 100_000;
const CHALLENGE_TIMEOUT = 2 * 60 * 1000;
const FLIP_DELAY = 1200;

type Side = "heads" | "tails";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const flip = (): Side => (randomNum(0, 1) ? "heads" : "tails");
const other = (side: Side): Side => (side === "heads" ? "tails" : "heads");

/** Accepts are handled one at a time, a double click would otherwise play the same challenge twice */
const resolving = new Set<string>();

export const data: CommandData = {
	name: "coinflip",
	...getLocalizedDesc("economy/coinflip:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	options: [
		{
			name: "bet",
			...getLocalizedDesc("economy/coinflip:BET"),
			type: ApplicationCommandOptionType.Integer,
			required: true,
			// eslint-disable-next-line camelcase
			min_value: MIN_BET,
			// eslint-disable-next-line camelcase
			max_value: MAX_BET,
		},
		{
			name: "side",
			...getLocalizedDesc("economy/coinflip:SIDE"),
			type: ApplicationCommandOptionType.String,
			required: true,
			choices: (["heads", "tails"] as const).map(side => ({
				name: client.i18n.translate(`economy/coinflip:SIDES:${side}`),
				// eslint-disable-next-line camelcase
				name_localizations: { ru: client.i18n.translate(`economy/coinflip:SIDES:${side}`, { lng: "ru-RU" }) },
				value: side,
			})),
		},
		{
			name: "user",
			...getLocalizedDesc("economy/coinflip:OPPONENT"),
			type: ApplicationCommandOptionType.User,
		},
	],
};

const message = (content: string, rows: ActionRowBuilder<ButtonBuilder>[] = []) => ({
	flags: MessageFlags.IsComponentsV2 as const,
	components: [createContainer().addTextDisplayComponents(createText(content)).addActionRowComponents(rows)],
	allowedMentions: { parse: [] },
});

const sideName = (context: Interaction, side: Side) => translateContext(context, `economy/coinflip:SIDES:${side}`);

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply();

	const bet = interaction.options.getInteger("bet", true);
	const side = interaction.options.getString("side", true) as Side;
	const opponent = interaction.options.getUser("user");
	const memberData = await client.getMemberData(interaction.guildId!, interaction.user.id);

	if (memberData.money < bet)
		return editReplyError(interaction, "economy/coinflip:NOT_ENOUGH", {
			credits: await formatCredits(interaction, bet),
		});

	const t = (key: string, args?: Record<string, unknown>) => translateContext(interaction, key, args);

	if (opponent) {
		if (opponent.bot) return editReplyError(interaction, "misc:BOT_USER");
		if (opponent.id === interaction.user.id) return editReplyError(interaction, "misc:CANT_YOURSELF");

		const id = `${COINFLIP_ID}:${interaction.user.id}:${opponent.id}:${bet}:${side}`;
		const challenge = message(
			await t("economy/coinflip:CHALLENGE", {
				user: interaction.user.toString(),
				opponent: opponent.toString(),
				credits: await formatCredits(interaction, bet),
				side: await sideName(interaction, side),
				other: await sideName(interaction, other(side)),
			}),
			[
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					new ButtonBuilder()
						.setCustomId(`${id}:accept`)
						.setLabel(await t("economy/coinflip:ACCEPT"))
						.setStyle(ButtonStyle.Success),
					new ButtonBuilder()
						.setCustomId(`${id}:decline`)
						.setLabel(await t("economy/coinflip:DECLINE"))
						.setStyle(ButtonStyle.Secondary),
				),
			],
		);

		await interaction.editReply({ ...challenge, allowedMentions: { users: [opponent.id] } });

		return;
	}

	if (!(await takeCredits(memberData, bet, await t("economy/coinflip:TRANSACTION"))))
		return editReplyError(interaction, "economy/coinflip:NOT_ENOUGH", {
			credits: await formatCredits(interaction, bet),
		});

	await interaction.editReply(message(await t("economy/coinflip:FLIPPING")));
	await sleep(FLIP_DELAY);

	const result = flip();
	const won = result === side;
	if (won) await giveCredits(memberData, bet * 2, await t("economy/coinflip:TRANSACTION"));

	await interaction.editReply(
		message(
			await t(won ? "economy/coinflip:WON" : "economy/coinflip:LOST", {
				side: await sideName(interaction, result),
				credits: await formatCredits(interaction, bet),
			}),
		),
	);
};

componentRouter.register(COINFLIP_ID, async interaction => {
	if (!interaction.isButton()) return;

	const [, challengerId, opponentId, betText, side, action] = interaction.customId.split(":");
	const bet = Number(betText);
	const t = (key: string, args?: Record<string, unknown>) => translateContext(interaction, key, args);

	if (interaction.user.id !== opponentId && interaction.user.id !== challengerId) {
		await interaction.reply({ content: await t("economy/coinflip:NOT_YOURS"), flags: MessageFlags.Ephemeral });
		return;
	}

	if (Date.now() - interaction.message.createdTimestamp > CHALLENGE_TIMEOUT) {
		await interaction.update(message(await t("economy/coinflip:EXPIRED")));
		return;
	}

	if (action === "decline") {
		const key = interaction.user.id === challengerId ? "economy/coinflip:CANCELLED" : "economy/coinflip:DECLINED";
		await interaction.update(message(await t(key, { user: interaction.user.toString() })));
		return;
	}

	if (interaction.user.id !== opponentId) {
		await interaction.reply({ content: await t("economy/coinflip:NOT_YOURS"), flags: MessageFlags.Ephemeral });
		return;
	}

	if (resolving.has(interaction.message.id)) {
		await interaction.deferUpdate();
		return;
	}

	resolving.add(interaction.message.id);

	try {
		const [challenger, opponent] = await Promise.all([
			client.getMemberData(interaction.guildId!, challengerId),
			client.getMemberData(interaction.guildId!, opponentId),
		]);
		const [challengerUser, opponentUser] = await Promise.all([
			client.users.fetch(challengerId),
			client.users.fetch(opponentId),
		]);

		const label = (user: typeof challengerUser) =>
			t("economy/coinflip:TRANSACTION_VS", { user: getUsername(user) });

		if (!(await takeCredits(challenger, bet, await label(opponentUser)))) {
			await interaction.update(
				message(await t("economy/coinflip:CHALLENGER_BROKE", { user: `<@${challengerId}>` })),
			);
			return;
		}

		if (!(await takeCredits(opponent, bet, await label(challengerUser)))) {
			await giveCredits(challenger, bet, await label(opponentUser));
			await interaction.reply({
				content: await t("economy/coinflip:NOT_ENOUGH", { credits: await formatCredits(interaction, bet) }),
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		await interaction.update(message(await t("economy/coinflip:FLIPPING")));
		await sleep(FLIP_DELAY);

		const result = flip();
		const [winnerId, winner, loserId] =
			result === side ? [challengerId, challenger, opponentId] : [opponentId, opponent, challengerId];

		await giveCredits(winner, bet * 2, await label(winnerId === challengerId ? opponentUser : challengerUser));

		await interaction.editReply(
			message(
				await t("economy/coinflip:PVP_RESULT", {
					side: await sideName(interaction, result as Side),
					winner: `<@${winnerId}>`,
					loser: `<@${loserId}>`,
					credits: await formatCredits(interaction, bet * 2),
				}),
			),
		);
	} finally {
		resolving.delete(interaction.message.id);
	}
});
