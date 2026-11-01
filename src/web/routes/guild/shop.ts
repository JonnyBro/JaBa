import { getShopItems, isInventoryItem, MAX_SHOP_ITEMS } from "@/helpers/shop.js";
import MemberModel from "@/models/MemberModel.js";
import ShopItemModel, {
	IShopItemSchema,
	SHOP_EFFECTS,
	SHOP_ITEM_TYPES,
	ShopEffect,
	ShopItemType,
} from "@/models/ShopItemModel.js";
import { Guild } from "discord.js";
import { FastifyInstance } from "fastify";
import { Types } from "mongoose";
import { logAction } from "../../audit.js";
import { getAssignableRoles } from "../../roles.js";
import { fail, send } from "../../utils.js";

const MAX_NAME = 50;
const MAX_DESCRIPTION = 200;
const MAX_EMOJI = 64;
const MAX_PRICE = 1e9;
const MAX_STOCK = 1e6;
const MAX_LEVEL = 1000;
const HOUR = 60 * 60 * 1000;
const MAX_DURATION_HOURS = 365 * 24;

type ItemInput = Omit<IShopItemSchema, "_id" | "guildId" | "createdAt">;

const serialize = (item: IShopItemSchema) => ({
	id: item._id.toString(),
	name: item.name,
	description: item.description,
	emoji: item.emoji,
	type: item.type,
	price: item.price,
	roleId: item.roleId,
	durationHours: item.duration === null ? null : item.duration / HOUR,
	effect: item.effect,
	stock: item.stock,
	perUserLimit: item.perUserLimit,
	requiredLevel: item.requiredLevel,
	sellable: item.sellable,
	enabled: item.enabled,
});

const isInt = (value: unknown, min: number, max: number): value is number =>
	typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;

const optionalInt = (value: unknown, min: number, max: number) =>
	value === null || value === undefined ? null : isInt(value, min, max) ? value : undefined;

const parseItem = (guild: Guild, body: Record<string, unknown>): ItemInput | string => {
	const name = typeof body.name === "string" ? body.name.trim() : "";
	if (!name || name.length > MAX_NAME) return `The name must be 1-${MAX_NAME} characters long`;

	const description = typeof body.description === "string" ? body.description.trim() : "";
	if (description.length > MAX_DESCRIPTION) return `The description can be up to ${MAX_DESCRIPTION} characters`;

	const emoji = typeof body.emoji === "string" && body.emoji.trim() ? body.emoji.trim() : null;
	if (emoji && emoji.length > MAX_EMOJI) return "That emoji is too long";

	const type = SHOP_ITEM_TYPES.find(t => t === body.type) as ShopItemType | undefined;
	if (!type) return "Unknown item type";

	if (!isInt(body.price, 0, MAX_PRICE)) return `The price must be a whole number from 0 to ${MAX_PRICE}`;

	const stock = optionalInt(body.stock, 0, MAX_STOCK);
	if (stock === undefined) return `The stock must be empty or a whole number from 0 to ${MAX_STOCK}`;

	const requiredLevel = body.requiredLevel ?? 0;
	if (!isInt(requiredLevel, 0, MAX_LEVEL)) return `The level must be a whole number from 0 to ${MAX_LEVEL}`;

	const inventory = isInventoryItem({ type });
	const perUserLimit = inventory ? optionalInt(body.perUserLimit, 1, MAX_STOCK) : null;
	if (perUserLimit === undefined) return "The per member limit must be empty or a whole number above 0";

	let roleId: string | null = null;
	if (type === "role" || type === "temp_role") {
		const role = typeof body.roleId === "string" ? guild.roles.cache.get(body.roleId) : null;
		if (!role) return "Pick a role";
		if (!role.editable || role.managed || role.id === guild.id) return "The bot can't give this role";

		roleId = role.id;
	}

	let duration: number | null = null;
	if (type === "temp_role" || type === "consumable") {
		if (!isInt(body.durationHours, 1, MAX_DURATION_HOURS))
			return `The duration must be a whole number of hours from 1 to ${MAX_DURATION_HOURS}`;

		duration = body.durationHours * HOUR;
	}

	let effect: ShopEffect | null = null;
	if (type === "consumable") {
		effect = SHOP_EFFECTS.find(e => e === body.effect) ?? null;
		if (!effect) return "Pick an effect";
	}

	return {
		name,
		description,
		emoji,
		type,
		price: body.price,
		roleId,
		duration,
		effect,
		stock,
		perUserLimit,
		requiredLevel,
		sellable: inventory && body.sellable === true,
		enabled: body.enabled !== false,
	};
};

export default async function shopRoutes(fastify: FastifyInstance) {
	fastify.get("/shop", async (req, reply) =>
		send(reply, {
			items: (await getShopItems(req.guild.id)).map(serialize),
			roles: getAssignableRoles(req.guild),
			effects: SHOP_EFFECTS,
			max: MAX_SHOP_ITEMS,
		}),
	);

	fastify.post("/shop", async (req, reply) => {
		const input = parseItem(req.guild, (req.body ?? {}) as Record<string, unknown>);
		if (typeof input === "string") return fail(reply, 400, input);

		if ((await ShopItemModel.countDocuments({ guildId: req.guild.id })) >= MAX_SHOP_ITEMS)
			return fail(reply, 400, `A shop can have up to ${MAX_SHOP_ITEMS} items`);

		const item = await ShopItemModel.create({ ...input, guildId: req.guild.id });

		await logAction(req, req.guild.id, {
			action: "shop.create",
			target: { id: item._id.toString(), name: item.name },
		});

		return send(reply, serialize(item.toObject()), 201);
	});

	fastify.put("/shop/:itemId", async (req, reply) => {
		const { itemId } = req.params as { itemId: string };
		if (!Types.ObjectId.isValid(itemId)) return fail(reply, 404, "Item not found");

		const input = parseItem(req.guild, (req.body ?? {}) as Record<string, unknown>);
		if (typeof input === "string") return fail(reply, 400, input);

		const item = await ShopItemModel.findOneAndUpdate({ _id: itemId, guildId: req.guild.id }, input, {
			returnDocument: "after",
		}).lean();
		if (!item) return fail(reply, 404, "Item not found");

		await logAction(req, req.guild.id, { action: "shop.update", target: { id: itemId, name: item.name } });

		return send(reply, serialize(item));
	});

	fastify.delete("/shop/:itemId", async (req, reply) => {
		const { itemId } = req.params as { itemId: string };
		if (!Types.ObjectId.isValid(itemId)) return fail(reply, 404, "Item not found");

		const item = await ShopItemModel.findOneAndDelete({ _id: itemId, guildId: req.guild.id }).lean();
		if (!item) return fail(reply, 404, "Item not found");

		// Bought roles stay with their owners, only inventory copies go away with the item
		await MemberModel.updateMany({ guildID: req.guild.id }, { $pull: { inventory: { item: item._id } } });

		await logAction(req, req.guild.id, { action: "shop.delete", target: { id: itemId, name: item.name } });

		return send(reply, { ok: true });
	});
}
