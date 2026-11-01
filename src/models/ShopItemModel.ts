import { model, Schema, Types } from "mongoose";

export const SHOP_ITEM_TYPES = ["role", "temp_role", "item", "consumable"] as const;
export const SHOP_EFFECTS = ["robShield", "workBoost"] as const;

export type ShopItemType = (typeof SHOP_ITEM_TYPES)[number];
export type ShopEffect = (typeof SHOP_EFFECTS)[number];

export interface IShopItemSchema {
	_id: Types.ObjectId;
	guildId: string;
	name: string;
	description: string;
	emoji: string | null;
	type: ShopItemType;
	price: number;
	roleId: string | null;
	/** How long a temp role or a consumable's effect lasts */
	duration: number | null;
	effect: ShopEffect | null;
	/** Left for the whole server, null is unlimited */
	stock: number | null;
	/** How many one member can hold at once, only for items that go to the inventory */
	perUserLimit: number | null;
	requiredLevel: number;
	sellable: boolean;
	enabled: boolean;
	createdAt: Date;
}

const shopItemSchema = new Schema<IShopItemSchema>(
	{
		guildId: { type: String, required: true },
		name: { type: String, required: true },
		description: { type: String, default: "" },
		emoji: { type: String, default: null },
		type: { type: String, enum: SHOP_ITEM_TYPES, required: true },
		price: { type: Number, required: true, min: 0 },
		roleId: { type: String, default: null },
		duration: { type: Number, default: null },
		effect: { type: String, enum: [...SHOP_EFFECTS, null], default: null },
		stock: { type: Number, default: null, min: 0 },
		perUserLimit: { type: Number, default: null, min: 1 },
		requiredLevel: { type: Number, default: 0, min: 0 },
		sellable: { type: Boolean, default: false },
		enabled: { type: Boolean, default: true },
	},
	{ timestamps: { createdAt: true, updatedAt: false } },
);

shopItemSchema.index({ guildId: 1, createdAt: 1 });

export default model<IShopItemSchema>("ShopItem", shopItemSchema);
