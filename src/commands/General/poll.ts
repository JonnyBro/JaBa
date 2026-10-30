import { getLocalizedDesc, translateContext } from "@/helpers/functions.js";
import { renderPoll } from "@/helpers/polls.js";
import PollModel from "@/models/PollModel.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import {
	ActionRowBuilder,
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	InteractionContextType,
	MessageFlags,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";
import ms, { StringValue } from "ms";

const MODAL_ID = "POLL_CREATE";
const MAX_QUESTION = 300;
const MAX_OPTION = 100;
const MAX_OPTIONS = 10;
const MIN_DURATION = 60 * 1000;
const MAX_DURATION = 30 * 24 * 60 * 60 * 1000;
const DEFAULT_DURATION = "1d";
const MODAL_TIMEOUT = 10 * 60 * 1000;

export const data: CommandData = {
	name: "poll",
	...getLocalizedDesc("general/poll:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	options: [
		{
			name: "duration",
			...getLocalizedDesc("general/poll:DURATION"),
			type: ApplicationCommandOptionType.String,
		},
		{
			name: "anonymous",
			...getLocalizedDesc("general/poll:ANONYMOUS_OPTION"),
			type: ApplicationCommandOptionType.Boolean,
		},
		{
			name: "multiple",
			...getLocalizedDesc("general/poll:MULTIPLE_OPTION"),
			type: ApplicationCommandOptionType.Boolean,
		},
		{
			name: "hidden",
			...getLocalizedDesc("general/poll:HIDDEN_OPTION"),
			type: ApplicationCommandOptionType.Boolean,
		},
	],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	const t = (key: string, args?: Record<string, unknown>) => translateContext(interaction, key, args);
	const fail = async (key: string, args?: Record<string, unknown>) =>
		void (await interaction.reply({ content: await t(key, args), flags: MessageFlags.Ephemeral }));

	const durationText = interaction.options.getString("duration") ?? DEFAULT_DURATION;
	const duration = ms(durationText as StringValue);
	if (!Number.isFinite(duration) || duration < MIN_DURATION || duration > MAX_DURATION)
		return fail("general/poll:BAD_DURATION");

	// Each run gets its own modal id, so a second /poll can't pick up this one's submit
	const modalId = `${MODAL_ID}:${interaction.id}`;

	await interaction.showModal(
		new ModalBuilder()
			.setCustomId(modalId)
			.setTitle(await t("general/poll:MODAL_TITLE"))
			.addComponents(
				new ActionRowBuilder<TextInputBuilder>().addComponents(
					new TextInputBuilder()
						.setCustomId("question")
						.setLabel(await t("general/poll:QUESTION"))
						.setStyle(TextInputStyle.Short)
						.setMaxLength(MAX_QUESTION)
						.setRequired(true),
				),
				new ActionRowBuilder<TextInputBuilder>().addComponents(
					new TextInputBuilder()
						.setCustomId("options")
						.setLabel(await t("general/poll:OPTIONS"))
						.setPlaceholder(await t("general/poll:OPTIONS_PLACEHOLDER"))
						.setStyle(TextInputStyle.Paragraph)
						.setMaxLength(MAX_OPTIONS * (MAX_OPTION + 1))
						.setRequired(true),
				),
			),
	);

	const submitted = await interaction
		.awaitModalSubmit({ time: MODAL_TIMEOUT, filter: i => i.customId === modalId })
		.catch(() => null);
	if (!submitted) return;

	const question = submitted.fields.getTextInputValue("question").trim();
	const options = [
		...new Set(
			submitted.fields
				.getTextInputValue("options")
				.split("\n")
				.map(line => line.trim())
				.filter(Boolean),
		),
	];

	if (options.length < 2 || options.length > MAX_OPTIONS || options.some(option => option.length > MAX_OPTION)) {
		await submitted.reply({
			content: await t("general/poll:BAD_OPTIONS", { max: MAX_OPTIONS, length: MAX_OPTION }),
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	const poll = await PollModel.create({
		guildId: interaction.guildId!,
		channelId: interaction.channelId,
		authorId: interaction.user.id,
		question,
		options,
		anonymous: interaction.options.getBoolean("anonymous") ?? false,
		multiple: interaction.options.getBoolean("multiple") ?? false,
		hidden: interaction.options.getBoolean("hidden") ?? false,
		endsAt: new Date(Date.now() + duration),
	});

	const response = await submitted.reply({ ...(await renderPoll(poll)), withResponse: true });
	await PollModel.updateOne({ _id: poll._id }, { messageId: response.resource?.message?.id ?? null });
};
