import { formatCredits, getGlobalCredits, transaction, updateMember } from "@/helpers/economy.js";
import { editReplyError, getLocalizedDesc, getUsername, replyError, translateContext } from "@/helpers/functions.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import { componentRouter } from "@/utils/component-router.js";
import { containerMessage, createContainer, createSeparator, createText } from "@/utils/create-container.js";
import useClient from "@/utils/use-client.js";
import {
	ActionRowBuilder,
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	Interaction,
	InteractionContextType,
	LabelBuilder,
	MessageFlags,
	ModalBuilder,
	ModalSubmitInteraction,
	TextInputBuilder,
	TextInputStyle,
	User,
	UserSelectMenuBuilder,
} from "discord.js";

const client = useClient();

const BANK_ID = "ECO_BANK";
const MODAL_TIMEOUT = 5 * 60 * 1000;
const HISTORY_SIZE = 20;

type Action = "deposit" | "withdraw" | "transfer" | "history" | "back";

export const data: CommandData = {
	name: "bank",
	...getLocalizedDesc("economy/bank:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	options: [
		{
			name: "user",
			...getLocalizedDesc("common:USER"),
			type: ApplicationCommandOptionType.User,
		},
	],
};

const parseCredits = (input: string, all: number) => {
	if (input.trim().toLowerCase() === "all") return all;

	const credits = Number(input.replace(/[\s,]/g, ""));
	return Number.isSafeInteger(credits) ? credits : NaN;
};

const t = (interaction: Interaction, key: string, args?: Record<string, unknown>) =>
	translateContext(interaction, key, args);

const button = (id: string, label: string, style: ButtonStyle, emoji: string) =>
	new ButtonBuilder().setCustomId(id).setLabel(label).setStyle(style).setEmoji(emoji);

export const renderBankPanel = async (interaction: Interaction, user: User, status?: string) => {
	const memberData = await client.getMemberData(interaction.guildId!, user.id);

	const globalMoney = await getGlobalCredits(user.id);

	const lines = [
		await t(interaction, "economy/profile:CREDITS", {
			credits: await formatCredits(interaction, memberData.money),
		}),
		await t(interaction, "economy/profile:BANK", { credits: await formatCredits(interaction, memberData.bank) }),
		await t(interaction, "economy/profile:GLOBAL", { credits: await formatCredits(interaction, globalMoney) }),
	];

	const container = createContainer()
		.addTextDisplayComponents(
			createText(`## 🏦 ${await t(interaction, "economy/bank:BANK")} · ${getUsername(user)}`),
		)
		.addSeparatorComponents(createSeparator())
		.addTextDisplayComponents(createText(lines.join("\n")));

	// Someone else's balance is read-only
	if (user.id === interaction.user.id)
		container.addActionRowComponents(
			new ActionRowBuilder<ButtonBuilder>().addComponents(
				button(
					`${BANK_ID}:deposit:${user.id}`,
					await t(interaction, "economy/bank:BTN_DEPOSIT"),
					ButtonStyle.Success,
					"📥",
				),
				button(
					`${BANK_ID}:withdraw:${user.id}`,
					await t(interaction, "economy/bank:BTN_WITHDRAW"),
					ButtonStyle.Primary,
					"📤",
				),
				button(
					`${BANK_ID}:transfer:${user.id}`,
					await t(interaction, "economy/bank:BTN_TRANSFER"),
					ButtonStyle.Secondary,
					"💸",
				),
				button(
					`${BANK_ID}:history:${user.id}`,
					await t(interaction, "economy/bank:BTN_HISTORY"),
					ButtonStyle.Secondary,
					"📜",
				),
			),
		);

	if (status) container.addSeparatorComponents(createSeparator()).addTextDisplayComponents(createText(status));

	return containerMessage(container);
};

const renderHistory = async (interaction: ButtonInteraction) => {
	const memberData = await client.getMemberData(interaction.guildId!, interaction.user.id);
	const transactions = [...memberData.transactions].sort((a, b) => b.date - a.date).slice(0, HISTORY_SIZE);

	const lines = await Promise.all(
		transactions.map(async tr => {
			const sign = tr.type === "got" ? "🟢 +" : "🔴 −";
			const amount = await formatCredits(interaction, tr.amount);

			return `${sign}${amount} · ${tr.user} · <t:${Math.floor(tr.date / 1000)}:R>`;
		}),
	);

	const container = createContainer()
		.addTextDisplayComponents(createText(`## 📜 ${await t(interaction, "economy/bank:EMBED_TRANSACTIONS")}`))
		.addSeparatorComponents(createSeparator())
		.addTextDisplayComponents(
			createText(lines.length ? lines.join("\n") : await t(interaction, "economy/bank:NO_TRANSACTIONS")),
		)
		.addActionRowComponents(
			new ActionRowBuilder<ButtonBuilder>().addComponents(
				button(
					`${BANK_ID}:back:${interaction.user.id}`,
					await t(interaction, "economy/bank:BTN_BACK"),
					ButtonStyle.Secondary,
					"⬅️",
				),
			),
		);

	return containerMessage(container);
};

const amountLabel = async (interaction: Interaction) =>
	new LabelBuilder().setLabel(await t(interaction, "economy/bank:AMOUNT")).setTextInputComponent(
		new TextInputBuilder()
			.setCustomId("amount")
			.setStyle(TextInputStyle.Short)
			.setPlaceholder(await t(interaction, "economy/bank:AMOUNT_PLACEHOLDER"))
			.setMaxLength(20)
			.setRequired(true),
	);

const askAmount = async (interaction: ButtonInteraction, action: "deposit" | "withdraw" | "transfer") => {
	// Each click gets its own modal id, so an older modal can't pick up this one's submit
	const modalId = `${BANK_ID}_MODAL:${interaction.id}`;
	const modal = new ModalBuilder()
		.setCustomId(modalId)
		.setTitle(await t(interaction, `economy/bank:${action.toUpperCase()}`));

	if (action === "transfer")
		modal.addLabelComponents(
			new LabelBuilder()
				.setLabel(await t(interaction, "economy/bank:RECIPIENT"))
				.setUserSelectMenuComponent(new UserSelectMenuBuilder().setCustomId("user").setRequired(true)),
		);

	modal.addLabelComponents(await amountLabel(interaction));

	await interaction.showModal(modal);

	return interaction.awaitModalSubmit({ time: MODAL_TIMEOUT, filter: i => i.customId === modalId }).catch(() => null);
};

const fail = async (submitted: ModalSubmitInteraction, key: string) => {
	await replyError(submitted, key, null, { prefixEmoji: "error", ephemeral: true });
};

const move = async (interaction: ButtonInteraction, action: "deposit" | "withdraw") => {
	const submitted = await askAmount(interaction, action);
	if (!submitted?.isFromMessage()) return;

	const memberData = await client.getMemberData(interaction.guildId!, interaction.user.id);
	const deposit = action === "deposit";
	const credits = parseCredits(
		submitted.fields.getTextInputValue("amount"),
		deposit ? memberData.money : memberData.bank,
	);
	if (!(credits > 0)) return fail(submitted, "misc:MORE_THAN_ZERO");

	const result = await updateMember(
		deposit ? { _id: memberData._id, money: { $gte: credits } } : { _id: memberData._id, bank: { $gte: credits } },
		{
			$inc: deposit ? { money: -credits, bank: credits } : { money: credits, bank: -credits },
			$push: {
				transactions: transaction(await t(interaction, "economy/bank:BANK"), credits, deposit ? "send" : "got"),
			},
		},
	);
	if (!result.modifiedCount)
		return fail(submitted, deposit ? "economy/bank:NOT_ENOUGH_CREDITS" : "economy/bank:NOT_ENOUGH_BANK");

	const status = await t(interaction, deposit ? "economy/bank:SUCCESS_DEP" : "economy/bank:SUCCESS_WD", {
		credits: await formatCredits(interaction, credits),
	});

	await submitted.update(await renderBankPanel(interaction, interaction.user, `-# ✅ ${status}`));
};

const transfer = async (interaction: ButtonInteraction) => {
	const submitted = await askAmount(interaction, "transfer");
	if (!submitted?.isFromMessage()) return;

	const target = submitted.fields.getSelectedUsers("user", true).first()!;
	if (target.bot) return fail(submitted, "misc:BOT_USER");
	if (target.id === interaction.user.id) return fail(submitted, "misc:CANT_YOURSELF");

	const member = await interaction.guild!.members.fetch(target.id).catch(() => null);
	if (!member) return fail(submitted, "misc:USER_NOT_FOUND");

	const memberData = await client.getMemberData(interaction.guildId!, interaction.user.id);
	const credits = parseCredits(submitted.fields.getTextInputValue("amount"), memberData.bank);
	if (!(credits > 0)) return fail(submitted, "misc:MORE_THAN_ZERO");

	const recieverData = await client.getMemberData(interaction.guildId!, target.id);

	const result = await updateMember(
		{ _id: memberData._id, bank: { $gte: credits } },
		{
			$inc: { bank: -credits },
			$push: {
				transactions: transaction(
					await t(interaction, "economy/bank:TRANSFER_TO", { user: getUsername(target) }),
					credits,
					"send",
				),
			},
		},
	);
	if (!result.modifiedCount) return fail(submitted, "economy/bank:NOT_ENOUGH_BANK");

	await updateMember(
		{ _id: recieverData._id },
		{
			$inc: { bank: credits },
			$push: {
				transactions: transaction(
					await t(interaction, "economy/bank:TRANSFER_FROM", { user: getUsername(interaction.user) }),
					credits,
					"got",
				),
			},
		},
	);

	const status = await t(interaction, "economy/bank:SUCCESS_TRANSFER", {
		reciever: target.toString(),
		credits: await formatCredits(interaction, credits),
	});

	await submitted.update(await renderBankPanel(interaction, interaction.user, `-# ✅ ${status}`));
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply();

	const user = interaction.options.getUser("user") ?? interaction.user;
	if (user.bot) return editReplyError(interaction, "misc:BOT_USER");

	await interaction.editReply(await renderBankPanel(interaction, user));
};

componentRouter.register(BANK_ID, async interaction => {
	if (!interaction.isButton()) return;

	const [, action, ownerId] = interaction.customId.split(":") as [string, Action, string];

	if (interaction.user.id !== ownerId) {
		await interaction.reply({
			content: await t(interaction, "economy/bank:NOT_YOURS"),
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	switch (action) {
		case "deposit":
		case "withdraw":
			return move(interaction, action);

		case "transfer":
			return transfer(interaction);

		case "history":
			return void (await interaction.update(await renderHistory(interaction)));

		case "back":
			return void (await interaction.update(await renderBankPanel(interaction, interaction.user)));
	}
});
