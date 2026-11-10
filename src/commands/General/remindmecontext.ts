import { getLocalizations, getNoun, replyError, shortenString, translateContext } from "@/helpers/functions.js";
import { parseDuration } from "@/helpers/duration.js";
import { isValidRemindDelay, MAX_REMINDS } from "@/helpers/reminds.js";
import UserModel from "@/models/UserModel.js";
import { MessageContextCommandProps } from "@/types.js";
import { containerMessage, createContainer, createText } from "@/utils/create-container.js";
import useClient from "@/utils/use-client.js";
import {
	ApplicationCommandType,
	ApplicationIntegrationType,
	ContextMenuCommandBuilder,
	escapeMarkdown,
	InteractionContextType,
	LabelBuilder,
	MessageFlags,
	ModalBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";

const client = useClient();

const MODAL_ID = "REMIND_MESSAGE";
const MODAL_TIMEOUT = 10 * 60 * 1000;
const MAX_NOTE = 500;
const MAX_QUOTE = 300;

const PRESETS: { amount: number; unit: "MINUTES" | "HOURS" | "DAYS"; value: string }[] = [
	{ amount: 30, unit: "MINUTES", value: "30m" },
	{ amount: 1, unit: "HOURS", value: "1h" },
	{ amount: 3, unit: "HOURS", value: "3h" },
	{ amount: 6, unit: "HOURS", value: "6h" },
	{ amount: 12, unit: "HOURS", value: "12h" },
	{ amount: 1, unit: "DAYS", value: "1d" },
	{ amount: 3, unit: "DAYS", value: "3d" },
	{ amount: 7, unit: "DAYS", value: "7d" },
];
const DEFAULT_PRESET = "1h";

export const data = new ContextMenuCommandBuilder()
	.setName(client.i18n.translate("general/remindme:CONTEXT_NAME", { lng: "en-US" }))
	.setNameLocalizations(getLocalizations("general/remindme:CONTEXT_NAME"))
	.setType(ApplicationCommandType.Message)
	.setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
	.setContexts([InteractionContextType.BotDM, InteractionContextType.PrivateChannel, InteractionContextType.Guild]);

export const run = async ({ interaction }: MessageContextCommandProps) => {
	const language = interaction.locale.split("-")[0];
	const locale = client.i18n.SupportedLanguages.find(lng => lng.split("-")[0] === language);
	const t = (key: string, args?: Record<string, unknown>) => translateContext(interaction, key, args, { locale });
	const target = interaction.targetMessage;

	const presetLabel = async ({ amount, unit }: (typeof PRESETS)[number]) => {
		const forms = await Promise.all(["1", "2", "5"].map(form => t(`misc:NOUNS:${unit}:${form}`)));

		return `${amount} ${getNoun(amount, forms)}`;
	};

	const options = await Promise.all(
		PRESETS.map(async preset =>
			new StringSelectMenuOptionBuilder()
				.setLabel(await presetLabel(preset))
				.setValue(preset.value)
				.setDefault(preset.value === DEFAULT_PRESET),
		),
	);

	const modalId = `${MODAL_ID}:${interaction.id}`;

	await interaction.showModal(
		new ModalBuilder()
			.setCustomId(modalId)
			.setTitle(await t("general/remindme:CONTEXT_NAME"))
			.addLabelComponents(
				new LabelBuilder()
					.setLabel(await t("general/remindme:MODAL_WHEN"))
					.setStringSelectMenuComponent(
						new StringSelectMenuBuilder().setCustomId("preset").setOptions(options).setRequired(false),
					),
				new LabelBuilder()
					.setLabel(await t("general/remindme:MODAL_CUSTOM"))
					.setDescription(await t("general/remindme:MODAL_CUSTOM_HINT"))
					.setTextInputComponent(
						new TextInputBuilder()
							.setCustomId("custom")
							.setStyle(TextInputStyle.Short)
							.setPlaceholder("2h30m")
							.setMaxLength(20)
							.setRequired(false),
					),
				new LabelBuilder()
					.setLabel(await t("general/remindme:MODAL_NOTE"))
					.setTextInputComponent(
						new TextInputBuilder()
							.setCustomId("note")
							.setStyle(TextInputStyle.Paragraph)
							.setMaxLength(MAX_NOTE)
							.setRequired(false),
					),
			),
	);

	const submitted = await interaction
		.awaitModalSubmit({ time: MODAL_TIMEOUT, filter: i => i.customId === modalId })
		.catch(() => null);
	if (!submitted) return;

	const custom = submitted.fields.getTextInputValue("custom").trim();
	const preset = submitted.fields.getStringSelectValues("preset")[0] ?? DEFAULT_PRESET;
	const delay = parseDuration(custom || preset);

	if (!delay || !isValidRemindDelay(delay))
		return replyError(submitted, "general/remindme:ERROR_TIME", null, { ephemeral: true, locale });

	const userData = await client.getUserData(interaction.user.id);
	if (userData.reminds.length >= MAX_REMINDS)
		return replyError(submitted, "general/remindme:TOO_MANY", { max: MAX_REMINDS }, { ephemeral: true, locale });

	const note = submitted.fields.getTextInputValue("note").trim();
	const quote = target.content.trim()
		? shortenString(target.content.trim(), MAX_QUOTE)
		: await t("general/remindme:NO_TEXT");
	const message = [note, `> **${escapeMarkdown(target.author.displayName)}:** ${quote.replace(/\n/g, "\n> ")}`]
		.filter(Boolean)
		.join("\n");

	const now = Date.now();
	const remind = {
		message,
		createdAt: Math.floor(now / 1000),
		sendAt: Math.floor((now + delay) / 1000),
		url: target.url,
	};

	await UserModel.updateOne({ id: userData.id }, { $push: { reminds: remind } });

	await submitted.reply({
		...containerMessage(
			createContainer().addTextDisplayComponents(
				createText(`## ⏰ ${await t("general/remindme:EMBED_SAVED")}`),
				createText(`-# ${await t("general/remindme:EMBED_TIME")} <t:${remind.sendAt}:R>`),
				createText(message),
			),
		),
		flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
	});
};
