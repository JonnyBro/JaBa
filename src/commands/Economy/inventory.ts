import { cooldownTime, formatCredits } from "@/helpers/economy.js";
import { getLocalizedDesc, shortenString, translateContext } from "@/helpers/functions.js";
import {
	activeEffects,
	describeType,
	EFFECT_EMOJI,
	getShopItems,
	giftItem,
	itemLabel,
	pageRow,
	paginate,
	sellItem,
	sellPrice,
	ShopItem,
	useItem,
} from "@/helpers/shop.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import { componentRouter } from "@/utils/component-router.js";
import { containerMessage, createContainer, createSeparator, createText } from "@/utils/create-container.js";
import useClient from "@/utils/use-client.js";
import {
	ActionRowBuilder,
	ApplicationIntegrationType,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	GuildMember,
	Interaction,
	InteractionContextType,
	LabelBuilder,
	MessageFlags,
	ModalBuilder,
	StringSelectMenuBuilder,
	UserSelectMenuBuilder,
} from "discord.js";

const client = useClient();

const INVENTORY_ID = "ECO_INV";
const INVENTORY_SELECT_ID = "ECO_INV_SELECT";
const MODAL_TIMEOUT = 5 * 60 * 1000;

export const data: CommandData = {
	name: "inventory",
	...getLocalizedDesc("economy/inventory:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	options: [],
};

const t = (interaction: Interaction, key: string, args?: Record<string, unknown>) =>
	translateContext(interaction, key, args);

/** Inventory entries joined with their shop items, ones deleted from the shop are dropped */
const getHeld = async (interaction: Interaction) => {
	const [memberData, items] = await Promise.all([
		client.getMemberData(interaction.guildId!, interaction.user.id),
		getShopItems(interaction.guildId!),
	]);

	const byId = new Map(items.map(item => [item._id.toString(), item]));
	const held: { item: ShopItem; quantity: number }[] = [];
	for (const entry of memberData.inventory) {
		const item = byId.get(entry.item.toString());
		if (item && entry.quantity > 0) held.push({ item, quantity: entry.quantity });
	}

	return { memberData, held };
};

const renderInventory = async (interaction: Interaction, requestedPage = 0, status?: string) => {
	const { memberData, held: allHeld } = await getHeld(interaction);
	const { page, pages, slice: held } = paginate(allHeld, requestedPage);

	const container = createContainer().addTextDisplayComponents(
		createText(`## 🎒 ${await t(interaction, "economy/inventory:TITLE")}`),
	);

	const effects = await Promise.all(
		activeEffects(memberData).map(
			async ({ effect, until }) =>
				`${EFFECT_EMOJI[effect]} ${await t(interaction, "economy/inventory:EFFECT_UNTIL", {
					effect: await t(interaction, `economy/shop:EFFECTS:${effect}`),
					time: cooldownTime(until),
				})}`,
		),
	);
	if (effects.length)
		container
			.addSeparatorComponents(createSeparator())
			.addTextDisplayComponents(
				createText(`**${await t(interaction, "economy/inventory:EFFECTS")}**\n${effects.join("\n")}`),
			);

	container.addSeparatorComponents(createSeparator());

	if (!held.length) container.addTextDisplayComponents(createText(await t(interaction, "economy/inventory:EMPTY")));
	else {
		const lines = held.map(({ item, quantity }) => `**${itemLabel(item)}** ×${quantity}`);

		container.addTextDisplayComponents(createText(lines.join("\n"))).addActionRowComponents(
			new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
				new StringSelectMenuBuilder()
					.setCustomId(`${INVENTORY_SELECT_ID}:${page}`)
					.setPlaceholder(await t(interaction, "economy/inventory:SELECT"))
					.addOptions(
						held.map(({ item, quantity }) => ({
							label: shortenString(`${item.name} ×${quantity}`, 100),
							value: item._id.toString(),
							emoji: item.emoji || undefined,
						})),
					),
			),
		);

		if (pages > 1) container.addActionRowComponents(pageRow(INVENTORY_ID, page, pages));
	}

	if (status) container.addSeparatorComponents(createSeparator()).addTextDisplayComponents(createText(status));

	return containerMessage(container);
};

const renderEntry = async (interaction: Interaction, itemId: string, page: number, status?: string) => {
	const { held } = await getHeld(interaction);
	const entry = held.find(e => e.item._id.toString() === itemId);
	if (!entry) return renderInventory(interaction, page, status);

	const { item, quantity } = entry;
	const buttons = [
		item.type === "consumable" &&
			new ButtonBuilder()
				.setCustomId(`${INVENTORY_ID}:use:${itemId}:${page}`)
				.setLabel(await t(interaction, "economy/inventory:USE"))
				.setEmoji("✨")
				.setStyle(ButtonStyle.Success),
		item.sellable &&
			new ButtonBuilder()
				.setCustomId(`${INVENTORY_ID}:sell:${itemId}:${page}`)
				.setLabel(
					(
						await t(interaction, "economy/inventory:SELL", {
							credits: await formatCredits(interaction, sellPrice(item)),
						})
					).replace(/\*/g, ""),
				)
				.setEmoji("💰")
				.setStyle(ButtonStyle.Primary),
		new ButtonBuilder()
			.setCustomId(`${INVENTORY_ID}:gift:${itemId}:${page}`)
			.setLabel(await t(interaction, "economy/inventory:GIFT"))
			.setEmoji("🎁")
			.setStyle(ButtonStyle.Secondary),
		new ButtonBuilder()
			.setCustomId(`${INVENTORY_ID}:back:${page}`)
			.setLabel(await t(interaction, "economy/shop:BACK"))
			.setEmoji("⬅️")
			.setStyle(ButtonStyle.Secondary),
	].filter((button): button is ButtonBuilder => !!button);

	const container = createContainer()
		.addTextDisplayComponents(
			createText(`## ${itemLabel(item)} ×${quantity}${item.description ? `\n${item.description}` : ""}`),
		)
		.addSeparatorComponents(createSeparator())
		.addTextDisplayComponents(createText(await describeType(interaction, item)))
		.addActionRowComponents(new ActionRowBuilder<ButtonBuilder>().addComponents(buttons));

	if (status) container.addSeparatorComponents(createSeparator()).addTextDisplayComponents(createText(status));

	return containerMessage(container);
};

const errorStatus = async (interaction: Interaction, key: string, args?: Record<string, unknown>) =>
	`❌ ${await t(interaction, key, args)}`;

const use = async (interaction: ButtonInteraction, itemId: string) => {
	const result = await useItem(interaction.member as GuildMember, itemId);

	if (result === "BUSY") return errorStatus(interaction, "economy/shop:ERRORS:BUSY");
	if (result === "NOT_USABLE") return errorStatus(interaction, "economy/inventory:NOT_USABLE");
	if (result === "NOT_HELD") return errorStatus(interaction, "economy/inventory:NOT_HELD");

	return `✅ ${await t(interaction, "economy/inventory:USED", {
		item: itemLabel(result.item),
		effect: await t(interaction, `economy/shop:EFFECTS:${result.item.effect}`),
		time: cooldownTime(result.until),
	})}`;
};

const sell = async (interaction: ButtonInteraction, itemId: string, item: ShopItem | undefined) => {
	const label = await t(interaction, "economy/inventory:TRANSACTION_SELL", { item: item?.name ?? "?" });
	const result = await sellItem(interaction.member as GuildMember, itemId, label);

	if (result === "BUSY") return errorStatus(interaction, "economy/shop:ERRORS:BUSY");
	if (result === "NOT_SELLABLE") return errorStatus(interaction, "economy/inventory:NOT_SELLABLE");
	if (result === "NOT_HELD") return errorStatus(interaction, "economy/inventory:NOT_HELD");

	return `✅ ${await t(interaction, "economy/inventory:SOLD", {
		item: itemLabel(result.item),
		credits: await formatCredits(interaction, result.price),
	})}`;
};

const gift = async (interaction: ButtonInteraction, itemId: string, page: number) => {
	// Each click gets its own modal id, so an older modal can't pick up this one's submit
	const modalId = `${INVENTORY_ID}_MODAL:${interaction.id}`;

	await interaction.showModal(
		new ModalBuilder()
			.setCustomId(modalId)
			.setTitle(await t(interaction, "economy/inventory:GIFT"))
			.addLabelComponents(
				new LabelBuilder()
					.setLabel(await t(interaction, "economy/inventory:RECIPIENT"))
					.setUserSelectMenuComponent(new UserSelectMenuBuilder().setCustomId("user").setRequired(true)),
			),
	);

	const submitted = await interaction
		.awaitModalSubmit({ time: MODAL_TIMEOUT, filter: i => i.customId === modalId })
		.catch(() => null);
	if (!submitted?.isFromMessage()) return;

	const target = submitted.fields.getSelectedUsers("user", true).first()!;
	const recipient = await interaction.guild!.members.fetch(target.id).catch(() => null);

	let status: string;
	if (target.bot) status = await errorStatus(interaction, "misc:BOT_USER");
	else if (target.id === interaction.user.id) status = await errorStatus(interaction, "misc:CANT_YOURSELF");
	else if (!recipient) status = await errorStatus(interaction, "misc:USER_NOT_FOUND");
	else {
		const result = await giftItem(interaction.member as GuildMember, recipient, itemId);

		if (result === "BUSY") status = await errorStatus(interaction, "economy/shop:ERRORS:BUSY");
		else if (result === "NOT_GIFTABLE" || result === "NOT_HELD")
			status = await errorStatus(interaction, "economy/inventory:NOT_HELD");
		else if (result === "LIMIT")
			status = await errorStatus(interaction, "economy/inventory:RECEIVER_LIMIT", { user: target.toString() });
		else
			status = `✅ ${await t(interaction, "economy/inventory:GIFTED", {
				item: itemLabel(result.item),
				user: target.toString(),
			})}`;
	}

	await submitted.update(await renderEntry(interaction, itemId, page, status));
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply({ flags: MessageFlags.Ephemeral });

	await interaction.editReply(await renderInventory(interaction));
};

componentRouter.register(INVENTORY_SELECT_ID, async interaction => {
	if (!interaction.isStringSelectMenu()) return;

	const page = Number(interaction.customId.split(":")[1]) || 0;
	await interaction.update(await renderEntry(interaction, interaction.values[0], page));
});

componentRouter.register(INVENTORY_ID, async interaction => {
	if (!interaction.isButton() || interaction.customId.startsWith(INVENTORY_SELECT_ID)) return;

	const [, action, ...args] = interaction.customId.split(":");

	if (action === "page" || action === "back")
		return void (await interaction.update(await renderInventory(interaction, Number(args.at(-1)) || 0)));

	const [itemId, pageText] = args;
	const page = Number(pageText) || 0;

	if (action === "gift") return gift(interaction, itemId, page);

	await interaction.deferUpdate();

	const { held } = await getHeld(interaction);
	const item = held.find(e => e.item._id.toString() === itemId)?.item;

	let status: string | undefined;
	if (action === "use") status = await use(interaction, itemId);
	if (action === "sell") status = await sell(interaction, itemId, item);

	await interaction.editReply(await renderEntry(interaction, itemId, page, status));
});
