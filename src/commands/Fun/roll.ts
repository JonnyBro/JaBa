import { editReplyError, getLocalizedDesc, randomNum, translateContext } from "@/helpers/functions.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import {
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	InteractionContextType,
	MessageFlags,
} from "discord.js";

const MAX_DICE = 100;
const MAX_SIDES = 1000;
const MAX_MODIFIER = 1000;
const MAX_SHOWN_ROLLS = 30;

export const data: CommandData = {
	name: "roll",
	...getLocalizedDesc("fun/roll:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall],
	contexts: [InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel],
	options: [
		{
			name: "dice",
			...getLocalizedDesc("fun/roll:DICE"),
			type: ApplicationCommandOptionType.String,
		},
		{
			name: "ephemeral",
			type: ApplicationCommandOptionType.Boolean,
			...getLocalizedDesc("misc:EPHEMERAL_RESPONSE"),
		},
	],
};

/** Parses dice notation like d20, 2d6 or 4d6-1 */
const parseDice = (input: string) => {
	const match = /^(\d*)d(\d+)\s*(?:([+-])\s*(\d+))?$/i.exec(input.replace(/\s+/g, ""));
	if (!match) return null;

	const count = match[1] ? Number(match[1]) : 1;
	const sides = Number(match[2]);
	const modifier = match[4] ? Number(match[4]) * (match[3] === "-" ? -1 : 1) : 0;

	if (count < 1 || count > MAX_DICE || sides < 2 || sides > MAX_SIDES || Math.abs(modifier) > MAX_MODIFIER)
		return null;

	return { count, sides, modifier };
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply({
		flags: interaction.options.getBoolean("ephemeral") ? MessageFlags.Ephemeral : undefined,
	});

	const input = interaction.options.getString("dice") ?? "1d6";
	const dice = parseDice(input);
	if (!dice) return editReplyError(interaction, "fun/roll:BAD_DICE", { dice: MAX_DICE, sides: MAX_SIDES });

	const rolls = Array.from({ length: dice.count }, () => randomNum(1, dice.sides));
	const total = rolls.reduce((sum, roll) => sum + roll, 0) + dice.modifier;

	const shown = rolls.slice(0, MAX_SHOWN_ROLLS).join(", ") + (rolls.length > MAX_SHOWN_ROLLS ? ", …" : "");
	const sign = dice.modifier > 0 ? "+" : "-";
	const modifier = dice.modifier ? ` ${sign} ${Math.abs(dice.modifier)}` : "";
	const notation = `${dice.count}d${dice.sides}${dice.modifier ? sign + Math.abs(dice.modifier) : ""}`;

	await interaction.editReply({
		content: await translateContext(interaction, "fun/roll:RESULT", {
			notation,
			rolls: dice.count > 1 || dice.modifier ? `[${shown}]${modifier} = ` : "",
			total,
		}),
	});
};
