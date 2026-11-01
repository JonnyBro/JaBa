import { formatCredits } from "@/helpers/economy.js";
import { getLocalizedDesc, shortenString, translateContext } from "@/helpers/functions.js";
import {
	buyItem,
	BuyResult,
	describeType,
	getShopItem,
	getShopItems,
	heldQuantity,
	isInventoryItem,
	itemLabel,
	pageRow,
	paginate,
	sellPrice,
	ShopItem,
} from "@/helpers/shop.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import { componentRouter } from "@/utils/component-router.js";
import { containerMessage, createContainer, createSeparator, createText } from "@/utils/create-container.js";
import useClient from "@/utils/use-client.js";
import {
	ActionRowBuilder,
	ApplicationIntegrationType,
	ButtonBuilder,
	ButtonStyle,
	GuildMember,
	Interaction,
	InteractionContextType,
	MessageFlags,
	StringSelectMenuBuilder,
} from "discord.js";

const client = useClient();

const SHOP_ID = "ECO_SHOP";
const SHOP_SELECT_ID = "ECO_SHOP_SELECT";

export const data: CommandData = {
	name: "shop",
	...getLocalizedDesc("economy/shop:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	options: [],
};

const t = (interaction: Interaction, key: string, args?: Record<string, unknown>) =>
	translateContext(interaction, key, args);

const itemSelect = async (interaction: Interaction, items: ShopItem[], page: number) =>
	new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
		new StringSelectMenuBuilder()
			.setCustomId(`${SHOP_SELECT_ID}:${page}`)
			.setPlaceholder(await t(interaction, "economy/shop:SELECT"))
			.addOptions(
				await Promise.all(
					items.map(async item => ({
						label: shortenString(item.name, 100),
						description: shortenString(await formatCredits(interaction, item.price), 100).replace(
							/\*/g,
							"",
						),
						value: item._id.toString(),
						emoji: item.emoji || undefined,
					})),
				),
			),
	);

const renderList = async (interaction: Interaction, requestedPage = 0) => {
	const allItems = await getShopItems(interaction.guildId!, true);
	const { page, pages, slice: items } = paginate(allItems, requestedPage);
	const memberData = await client.getMemberData(interaction.guildId!, interaction.user.id);

	const container = createContainer().addTextDisplayComponents(
		createText(
			`## 🛒 ${await t(interaction, "economy/shop:TITLE")} · ${interaction.guild!.name}\n-# ${await t(
				interaction,
				"economy/shop:CASH",
				{ credits: await formatCredits(interaction, memberData.money) },
			)}`,
		),
	);

	if (!items.length)
		return containerMessage(
			container
				.addSeparatorComponents(createSeparator())
				.addTextDisplayComponents(createText(await t(interaction, "economy/shop:EMPTY"))),
		);

	const lines = await Promise.all(
		items.map(async item => {
			const soldOut = item.stock === 0 ? ` · ${await t(interaction, "economy/shop:SOLD_OUT")}` : "";
			const description = item.description ? ` · ${shortenString(item.description, 80)}` : "";

			const price = await formatCredits(interaction, item.price);

			const type = await describeType(interaction, item);

			return `**${itemLabel(item)}** · ${price}${soldOut}\n-# ${type}${description}`;
		}),
	);

	container
		.addSeparatorComponents(createSeparator())
		.addTextDisplayComponents(createText(lines.join("\n")))
		.addActionRowComponents(await itemSelect(interaction, items, page));

	if (pages > 1) container.addActionRowComponents(pageRow(SHOP_ID, page, pages));

	return containerMessage(container);
};

const renderItem = async (interaction: Interaction, item: ShopItem, page: number, status?: string) => {
	const memberData = await client.getMemberData(interaction.guildId!, interaction.user.id);
	const held = heldQuantity(memberData, item._id);

	const details = [
		`**${await t(interaction, "economy/shop:PRICE")}:** ${await formatCredits(interaction, item.price)}`,
		await describeType(interaction, item),
		item.stock !== null &&
			(item.stock > 0
				? await t(interaction, "economy/shop:STOCK", { count: item.stock })
				: await t(interaction, "economy/shop:SOLD_OUT")),
		isInventoryItem(item) &&
			item.perUserLimit !== null &&
			(await t(interaction, "economy/shop:LIMIT", { limit: item.perUserLimit, held })),
		item.requiredLevel > 0 && (await t(interaction, "economy/shop:LEVEL", { level: item.requiredLevel })),
		isInventoryItem(item) &&
			item.sellable &&
			(await t(interaction, "economy/shop:SELLABLE", {
				credits: await formatCredits(interaction, sellPrice(item)),
			})),
	].filter(Boolean);

	const cantBuy =
		item.stock === 0 ||
		memberData.level < item.requiredLevel ||
		(isInventoryItem(item) && item.perUserLimit !== null && held >= item.perUserLimit);

	const container = createContainer()
		.addTextDisplayComponents(createText(`## ${itemLabel(item)}${item.description ? `\n${item.description}` : ""}`))
		.addSeparatorComponents(createSeparator())
		.addTextDisplayComponents(createText(details.join("\n")))
		.addActionRowComponents(
			new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setCustomId(`${SHOP_ID}:buy:${item._id}:${page}`)
					.setLabel(await t(interaction, "economy/shop:BUY"))
					.setEmoji("🛒")
					.setStyle(ButtonStyle.Success)
					.setDisabled(cantBuy),
				new ButtonBuilder()
					.setCustomId(`${SHOP_ID}:back:${page}`)
					.setLabel(await t(interaction, "economy/shop:BACK"))
					.setEmoji("⬅️")
					.setStyle(ButtonStyle.Secondary),
			),
		);

	if (status) container.addSeparatorComponents(createSeparator()).addTextDisplayComponents(createText(status));

	const cash = await t(interaction, "economy/shop:CASH", {
		credits: await formatCredits(interaction, memberData.money),
	});
	container.addTextDisplayComponents(createText(`-# ${cash}`));

	return containerMessage(container);
};

const buyStatus = async (interaction: Interaction, item: ShopItem, result: BuyResult) => {
	if (result.ok && result.expiresAt) {
		const time = `<t:${Math.floor(result.expiresAt.getTime() / 1000)}:f>`;
		return `✅ ${await t(interaction, "economy/shop:BOUGHT_UNTIL", { item: itemLabel(item), time })}`;
	}

	if (result.ok) return `✅ ${await t(interaction, "economy/shop:BOUGHT", { item: itemLabel(item) })}`;

	return `❌ ${await t(interaction, `economy/shop:ERRORS:${result.error}`, {
		level: item.requiredLevel,
		credits: await formatCredits(interaction, item.price),
	})}`;
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply({ flags: MessageFlags.Ephemeral });

	await interaction.editReply(await renderList(interaction));
};

componentRouter.register(SHOP_SELECT_ID, async interaction => {
	if (!interaction.isStringSelectMenu()) return;

	const page = Number(interaction.customId.split(":")[1]) || 0;
	const item = await getShopItem(interaction.guildId!, interaction.values[0]);

	await interaction.update(
		item?.enabled ? await renderItem(interaction, item, page) : await renderList(interaction, page),
	);
});

componentRouter.register(SHOP_ID, async interaction => {
	if (!interaction.isButton() || interaction.customId.startsWith(SHOP_SELECT_ID)) return;

	const [, action, ...args] = interaction.customId.split(":");

	if (action === "page" || action === "back")
		return void (await interaction.update(await renderList(interaction, Number(args.at(-1)) || 0)));
	if (action !== "buy") return;

	const [itemId, pageText] = args;
	const page = Number(pageText) || 0;

	await interaction.deferUpdate();

	const item = await getShopItem(interaction.guildId!, itemId);
	if (!item) return void (await interaction.editReply(await renderList(interaction, page)));

	const label = await t(interaction, "economy/shop:TRANSACTION", { item: item.name });
	const result = await buyItem(interaction.member as GuildMember, itemId, label);

	// Stock and limits could change with the purchase, so the item is read again
	const fresh = (await getShopItem(interaction.guildId!, itemId)) ?? item;
	await interaction.editReply(await renderItem(interaction, fresh, page, await buyStatus(interaction, item, result)));
});
