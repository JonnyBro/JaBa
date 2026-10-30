import { editReplyError, getLocalizedDesc, randomNum, translateContext } from "@/helpers/functions.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import { componentRouter } from "@/utils/component-router.js";
import useClient from "@/utils/use-client.js";
import {
	ActionRowBuilder,
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	ButtonBuilder,
	ButtonStyle,
	InteractionContextType,
	MessageFlags,
} from "discord.js";

const client = useClient();

const RPS_ID = "FUN_RPS";
const CHALLENGE_TIMEOUT = 2 * 60 * 1000;

const MOVES = ["rock", "paper", "scissors"] as const;
type Move = (typeof MOVES)[number];

const EMOJI: Record<Move, string> = { rock: "🪨", paper: "📄", scissors: "✂️" };
const BEATS: Record<Move, Move> = { rock: "scissors", paper: "rock", scissors: "paper" };

type Challenge = { challengerId: string; opponentId: string; move: Move };

// The challenger's move stays on the server, in the buttons anyone could read it from the message data
const challenges = new Map<string, Challenge>();

export const data: CommandData = {
	name: "rps",
	...getLocalizedDesc("fun/rps:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	options: [
		{
			name: "move",
			...getLocalizedDesc("fun/rps:MOVE"),
			type: ApplicationCommandOptionType.String,
			required: true,
			choices: MOVES.map(move => ({
				name: `${EMOJI[move]} ${client.i18n.translate(`fun/rps:MOVES:${move}`)}`,
				// eslint-disable-next-line camelcase
				name_localizations: {
					ru: `${EMOJI[move]} ${client.i18n.translate(`fun/rps:MOVES:${move}`, { lng: "ru-RU" })}`,
				},
				value: move,
			})),
		},
		{
			name: "user",
			...getLocalizedDesc("fun/rps:OPPONENT"),
			type: ApplicationCommandOptionType.User,
		},
	],
};

const outcome = (a: Move, b: Move) => (a === b ? "draw" : BEATS[a] === b ? "win" : "lose");

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply();

	const move = interaction.options.getString("move", true) as Move;
	const opponent = interaction.options.getUser("user");
	const t = (key: string, args?: Record<string, unknown>) => translateContext(interaction, key, args);
	const moveName = async (m: Move) => `${EMOJI[m]} ${await t(`fun/rps:MOVES:${m}`)}`;

	if (!opponent) {
		const botMove = MOVES[randomNum(0, 2)];

		await interaction.editReply(
			await t(`fun/rps:BOT_${outcome(move, botMove).toUpperCase()}`, {
				move: await moveName(move),
				bot: await moveName(botMove),
			}),
		);
		return;
	}

	if (opponent.bot) return editReplyError(interaction, "misc:BOT_USER");
	if (opponent.id === interaction.user.id) return editReplyError(interaction, "misc:CANT_YOURSELF");

	const buttons = await Promise.all(
		MOVES.map(async m =>
			new ButtonBuilder()
				.setCustomId(`${RPS_ID}:${m}`)
				.setEmoji(EMOJI[m])
				.setLabel(await t(`fun/rps:MOVES:${m}`))
				.setStyle(ButtonStyle.Secondary),
		),
	);
	buttons.push(
		new ButtonBuilder()
			.setCustomId(`${RPS_ID}:decline`)
			.setLabel(await t("fun/rps:DECLINE"))
			.setStyle(ButtonStyle.Danger),
	);

	const message = await interaction.editReply({
		content: await t("fun/rps:CHALLENGE", { user: interaction.user.toString(), opponent: opponent.toString() }),
		components: [new ActionRowBuilder<ButtonBuilder>().addComponents(buttons)],
		allowedMentions: { users: [opponent.id] },
	});

	challenges.set(message.id, { challengerId: interaction.user.id, opponentId: opponent.id, move });
	setTimeout(async () => {
		if (!challenges.delete(message.id)) return;

		await interaction.editReply({ content: await t("fun/rps:EXPIRED"), components: [] }).catch(() => {});
	}, CHALLENGE_TIMEOUT);
};

componentRouter.register(RPS_ID, async interaction => {
	if (!interaction.isButton()) return;

	const t = (key: string, args?: Record<string, unknown>) => translateContext(interaction, key, args);
	const challenge = challenges.get(interaction.message.id);

	if (!challenge) {
		await interaction.update({ content: await t("fun/rps:EXPIRED"), components: [] });
		return;
	}

	const action = interaction.customId.split(":")[1];
	const { challengerId, opponentId } = challenge;

	if (action === "decline" && (interaction.user.id === opponentId || interaction.user.id === challengerId)) {
		challenges.delete(interaction.message.id);
		await interaction.update({
			content: await t(interaction.user.id === challengerId ? "fun/rps:CANCELLED" : "fun/rps:DECLINED", {
				user: interaction.user.toString(),
			}),
			components: [],
			allowedMentions: { parse: [] },
		});
		return;
	}

	if (interaction.user.id !== opponentId) {
		await interaction.reply({ content: await t("fun/rps:NOT_YOURS"), flags: MessageFlags.Ephemeral });
		return;
	}

	challenges.delete(interaction.message.id);

	const move = action as Move;
	const result = outcome(challenge.move, move);
	const moveName = async (m: Move) => `${EMOJI[m]} ${await t(`fun/rps:MOVES:${m}`)}`;

	await interaction.update({
		content: await t(result === "draw" ? "fun/rps:PVP_DRAW" : "fun/rps:PVP_RESULT", {
			challenger: `<@${challengerId}>`,
			opponent: `<@${opponentId}>`,
			challengerMove: await moveName(challenge.move),
			opponentMove: await moveName(move),
			winner: `<@${result === "win" ? challengerId : opponentId}>`,
		}),
		components: [],
		allowedMentions: { parse: [] },
	});
});
