import { giveCredits, takeCredits, updateMember } from "@/helpers/economy.js";
import { getNoun, translateContext } from "@/helpers/functions.js";
import { IMemberSchema } from "@/models/MemberModel.js";
import ShopItemModel, { IShopItemSchema, ShopEffect } from "@/models/ShopItemModel.js";
import TempRoleModel from "@/models/TempRoleModel.js";
import useClient from "@/utils/use-client.js";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, GuildMember, Interaction } from "discord.js";
import { QueryFilter, Types } from "mongoose";

export const MAX_SHOP_ITEMS = 100;
export const PAGE_SIZE = 10;
export const SELL_RATE = 0.5;

export type ShopItem = IShopItemSchema;
type MemberRef = { _id: Types.ObjectId };

export const EFFECT_EMOJI: Record<ShopEffect, string> = { robShield: "🛡️", workBoost: "⚡" };

export const isInventoryItem = (item: Pick<ShopItem, "type">) => item.type === "item" || item.type === "consumable";

export const sellPrice = (item: Pick<ShopItem, "price">) => Math.floor(item.price * SELL_RATE);

export const itemLabel = (item: Pick<ShopItem, "emoji" | "name">) =>
	`${item.emoji ? `${item.emoji} ` : ""}${item.name}`;

export const getShopItems = (guildId: string, onlyEnabled = false) =>
	ShopItemModel.find({ guildId, ...(onlyEnabled && { enabled: true }) })
		.sort({ createdAt: 1 })
		.lean();

export const getShopItem = (guildId: string, itemId: string) =>
	Types.ObjectId.isValid(itemId) ? ShopItemModel.findOne({ _id: itemId, guildId }).lean() : null;

export const heldQuantity = (memberData: Pick<IMemberSchema, "inventory">, itemId: Types.ObjectId | string) =>
	memberData.inventory.find(entry => entry.item.toString() === itemId.toString())?.quantity ?? 0;

/** Purchases and inventory changes of one member run one at a time, so limits can't be passed by clicking fast */
const locks = new Set<string>();

const withLock = async <T>(key: string, fn: () => Promise<T>): Promise<T | "BUSY"> => {
	if (locks.has(key)) return "BUSY";

	locks.add(key);
	try {
		return await fn();
	} finally {
		locks.delete(key);
	}
};

const addToInventory = async (member: MemberRef, itemId: Types.ObjectId, quantity: number) => {
	const result = await updateMember({ _id: member._id, "inventory.item": itemId } as QueryFilter<IMemberSchema>, {
		$inc: { "inventory.$.quantity": quantity },
	});

	if (!result.modifiedCount)
		await updateMember({ _id: member._id }, { $push: { inventory: { item: itemId, quantity } } });
};

/** Returns false when the member doesn't hold that many */
const takeFromInventory = async (member: MemberRef, itemId: Types.ObjectId, quantity: number) => {
	const result = await updateMember(
		{ _id: member._id, inventory: { $elemMatch: { item: itemId, quantity: { $gte: quantity } } } },
		{ $inc: { "inventory.$.quantity": -quantity } },
	);
	if (!result.modifiedCount) return false;

	// Validators would check the $pull condition as if it were a whole inventory entry and reject it
	await updateMember(
		{ _id: member._id },
		{ $pull: { inventory: { quantity: { $lte: 0 } } } },
		{ runValidators: false },
	);

	return true;
};

const releaseStock = (item: ShopItem) =>
	item.stock !== null && ShopItemModel.updateOne({ _id: item._id }, { $inc: { stock: 1 } });

const giveTempRole = async (member: GuildMember, item: ShopItem) => {
	const existing = await TempRoleModel.findOne({
		guildId: member.guild.id,
		userId: member.id,
		roleId: item.roleId,
	}).lean();

	// Buying again while the role is still on extends it instead of starting over
	const from = Math.max(existing?.expiresAt.getTime() ?? 0, Date.now());
	const expiresAt = new Date(from + item.duration!);

	await member.roles.add(item.roleId!, `Bought "${item.name}" in the shop`);
	await TempRoleModel.updateOne(
		{ guildId: member.guild.id, userId: member.id, roleId: item.roleId },
		{ expiresAt },
		{ upsert: true },
	);

	return expiresAt;
};

type BuyError =
	"BUSY" | "NOT_FOUND" | "LEVEL" | "OUT_OF_STOCK" | "LIMIT" | "HAS_ROLE" | "ROLE_UNAVAILABLE" | "NOT_ENOUGH";

export type BuyResult = { ok: true; expiresAt?: Date } | { ok: false; error: BuyError };

export const buyItem = async (member: GuildMember, itemId: string, label: string): Promise<BuyResult> => {
	const result = await withLock(`${member.guild.id}:${member.id}`, async (): Promise<BuyResult> => {
		const item = await getShopItem(member.guild.id, itemId);
		if (!item?.enabled) return { ok: false, error: "NOT_FOUND" };

		const memberData = await useClient().getMemberData(member.guild.id, member.id);
		if (memberData.level < item.requiredLevel) return { ok: false, error: "LEVEL" };

		if (item.roleId) {
			const role = member.guild.roles.cache.get(item.roleId);
			if (!role?.editable) return { ok: false, error: "ROLE_UNAVAILABLE" };
			if (item.type === "role" && member.roles.cache.has(role.id)) return { ok: false, error: "HAS_ROLE" };
		}

		if (
			isInventoryItem(item) &&
			item.perUserLimit !== null &&
			heldQuantity(memberData, item._id) >= item.perUserLimit
		)
			return { ok: false, error: "LIMIT" };

		if (item.stock !== null) {
			const reserved = await ShopItemModel.updateOne(
				{ _id: item._id, stock: { $gt: 0 } },
				{ $inc: { stock: -1 } },
			);
			if (!reserved.modifiedCount) return { ok: false, error: "OUT_OF_STOCK" };
		}

		if (!(await takeCredits(memberData, item.price, label))) {
			await releaseStock(item);
			return { ok: false, error: "NOT_ENOUGH" };
		}

		try {
			if (item.type === "role") await member.roles.add(item.roleId!, `Bought "${item.name}" in the shop`);
			if (item.type === "temp_role") return { ok: true, expiresAt: await giveTempRole(member, item) };
			if (isInventoryItem(item)) await addToInventory(memberData, item._id, 1);
		} catch {
			// Mostly the role was moved above the bot's or removed after the check
			await giveCredits(memberData, item.price);
			await releaseStock(item);
			return { ok: false, error: "ROLE_UNAVAILABLE" };
		}

		return { ok: true };
	});

	return result === "BUSY" ? { ok: false, error: "BUSY" } : result;
};

export const useItem = async (member: GuildMember, itemId: string) => {
	const result = await withLock(`${member.guild.id}:${member.id}`, async () => {
		const item = await getShopItem(member.guild.id, itemId);
		if (item?.type !== "consumable" || !item.effect || !item.duration) return "NOT_USABLE" as const;

		const memberData = await useClient().getMemberData(member.guild.id, member.id);
		if (!(await takeFromInventory(memberData, item._id, 1))) return "NOT_HELD" as const;

		// Using another one while the effect is on adds to the time left
		const until = Math.max(memberData.effects[item.effect], Date.now()) + item.duration;
		await updateMember({ _id: memberData._id }, { $max: { [`effects.${item.effect}`]: until } });

		return { item, until };
	});

	return result;
};

export const sellItem = async (member: GuildMember, itemId: string, label: string) =>
	withLock(`${member.guild.id}:${member.id}`, async () => {
		const item = await getShopItem(member.guild.id, itemId);
		if (!item || !isInventoryItem(item) || !item.sellable) return "NOT_SELLABLE" as const;

		const memberData = await useClient().getMemberData(member.guild.id, member.id);
		if (!(await takeFromInventory(memberData, item._id, 1))) return "NOT_HELD" as const;

		const price = sellPrice(item);
		if (price > 0) await giveCredits(memberData, price, label);

		return { item, price };
	});

export const giftItem = async (from: GuildMember, to: GuildMember, itemId: string) =>
	withLock(`${from.guild.id}:${from.id}`, async () => {
		const item = await getShopItem(from.guild.id, itemId);
		if (!item || !isInventoryItem(item)) return "NOT_GIFTABLE" as const;

		const client = useClient();
		const [giver, receiver] = await Promise.all([
			client.getMemberData(from.guild.id, from.id),
			client.getMemberData(to.guild.id, to.id),
		]);

		if (item.perUserLimit !== null && heldQuantity(receiver, item._id) >= item.perUserLimit)
			return "LIMIT" as const;
		if (!(await takeFromInventory(giver, item._id, 1))) return "NOT_HELD" as const;

		await addToInventory(receiver, item._id, 1);

		return { item };
	});

export const activeEffects = (memberData: Pick<IMemberSchema, "effects">) =>
	(Object.keys(EFFECT_EMOJI) as ShopEffect[])
		.filter(effect => memberData.effects?.[effect] > Date.now())
		.map(effect => ({ effect, until: memberData.effects[effect] }));

export const hasEffect = (memberData: Pick<IMemberSchema, "effects">, effect: ShopEffect) =>
	(memberData.effects?.[effect] ?? 0) > Date.now();

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export const formatDuration = async (context: Interaction, ms: number) => {
	const days = ms % DAY === 0;
	const count = days ? ms / DAY : Math.round(ms / HOUR);
	const forms = await Promise.all(
		["1", "2", "5"].map(form => translateContext(context, `misc:NOUNS:${days ? "DAYS" : "HOURS"}:${form}`)),
	);

	return `${count} ${getNoun(count, forms)}`;
};

export const describeType = async (context: Interaction, item: ShopItem) => {
	const t = (key: string, args?: Record<string, unknown>) => translateContext(context, key, args);
	const role = item.roleId ? `<@&${item.roleId}>` : "?";
	const duration = item.duration ? await formatDuration(context, item.duration) : "";

	if (item.type === "role") return t("economy/shop:TYPE_ROLE", { role });
	if (item.type === "temp_role") return t("economy/shop:TYPE_TEMP_ROLE", { role, duration });
	if (item.type === "item") return t("economy/shop:TYPE_ITEM");

	return t("economy/shop:TYPE_CONSUMABLE", {
		effect: await t(`economy/shop:EFFECTS:${item.effect}`),
		duration,
	});
};

export const paginate = <T>(entries: T[], page: number) => {
	const pages = Math.max(Math.ceil(entries.length / PAGE_SIZE), 1);
	const current = Math.min(Math.max(page, 0), pages - 1);

	return { page: current, pages, slice: entries.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE) };
};

/** Arrows around a disabled page counter, the ids differ so all three fit in one row */
export const pageRow = (prefix: string, page: number, pages: number) =>
	new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setCustomId(`${prefix}:page:${page - 1}`)
			.setEmoji("⬅️")
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(page === 0),
		new ButtonBuilder()
			.setCustomId(`${prefix}:counter`)
			.setLabel(`${page + 1} / ${pages}`)
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(true),
		new ButtonBuilder()
			.setCustomId(`${prefix}:page:${page + 1}`)
			.setEmoji("➡️")
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(page === pages - 1),
	);
