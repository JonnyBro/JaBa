import { getLocalizedDesc, randomNum, replyError, shortenString, translateContext } from "@/helpers/functions.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import {
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	InteractionContextType,
	LabelBuilder,
	MessageFlags,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";

const MODAL_ID = "FUN_CHOOSE";
const MAX_OPTIONS = 25;
const MAX_OPTION = 100;
const MODAL_TIMEOUT = 10 * 60 * 1000;

export const data: CommandData = {
	name: "choose",
	...getLocalizedDesc("fun/choose:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall],
	contexts: [InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel],
	options: [
		{
			name: "ephemeral",
			type: ApplicationCommandOptionType.Boolean,
			...getLocalizedDesc("misc:EPHEMERAL_RESPONSE"),
		},
	],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	const t = (key: string, args?: Record<string, unknown>) => translateContext(interaction, key, args);

	// Each run gets its own modal id, so a second /choose can't pick up this one's submit
	const modalId = `${MODAL_ID}:${interaction.id}`;

	await interaction.showModal(
		new ModalBuilder()
			.setCustomId(modalId)
			.setTitle(await t("fun/choose:MODAL_TITLE"))
			.addLabelComponents(
				new LabelBuilder().setLabel(await t("fun/choose:OPTIONS")).setTextInputComponent(
					new TextInputBuilder()
						.setCustomId("options")
						.setPlaceholder(await t("fun/choose:OPTIONS_PLACEHOLDER"))
						.setStyle(TextInputStyle.Paragraph)
						.setMaxLength(4000)
						.setRequired(true),
				),
			),
	);

	const submitted = await interaction
		.awaitModalSubmit({ time: MODAL_TIMEOUT, filter: i => i.customId === modalId })
		.catch(() => null);
	if (!submitted) return;

	const options = [
		...new Set(
			submitted.fields
				.getTextInputValue("options")
				.split("\n")
				.map(option => option.trim())
				.filter(Boolean),
		),
	];

	if (options.length < 2 || options.length > MAX_OPTIONS || options.some(option => option.length > MAX_OPTION))
		return replyError(
			submitted,
			"fun/choose:BAD_OPTIONS",
			{ max: MAX_OPTIONS, length: MAX_OPTION },
			{ prefixEmoji: "error", ephemeral: true },
		);

	const choice = await t("fun/choose:RESULT", { choice: options[randomNum(0, options.length - 1)] });
	const from = shortenString(options.join(" · "), 1500);

	await submitted.reply({
		content: `${choice}\n-# ${from}`,
		flags: interaction.options.getBoolean("ephemeral") ? MessageFlags.Ephemeral : undefined,
		allowedMentions: { parse: [] },
	});
};
