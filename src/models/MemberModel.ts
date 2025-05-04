import type { ObjectId } from "mongodb";
import { Entity, ManyToOne, Property } from "@mikro-orm/core";
import { Guild } from "./GuildModel.js";
import { BaseEntity } from "../structures/BaseEntity.js";

// Вложенные интерфейсы для типизации
interface Transaction {
	user: string;
	amount: number;
	date: number;
	type: string;
}

interface Cooldowns {
	work: number;
	rob: number;
}

interface Mute {
	muted: boolean;
	case: string | null;
	endDate: number | null;
}

@Entity({ collection: "members" })
export class Member extends BaseEntity {
	@Property({ type: "ObjectId", primary: true })
	_id!: ObjectId;

	@Property({ type: "string", unique: true })
	id!: string;

	@ManyToOne(() => Guild, { index: true })
	guildID!: string;

	@Property({ type: "int" })
	money = 0;

	@Property({ type: "int" })
	workStreak = 0;

	@Property({ type: "int" })
	bankSold = 0;

	@Property({ type: "int" })
	exp = 0;

	@Property({ type: "int" })
	level = 0;

	@Property({ type: "array" })
	transactions: Transaction[] = [];

	@Property({ type: "int", onCreate: () => Date.now() })
	registeredAt!: number;

	@Property({ type: "json" })
	cooldowns: Cooldowns = { work: 0, rob: 0 };

	@Property({ type: "array" })
	sanctions: any[][] = [];

	@Property({ type: "json" }) // Объект
	mute: Mute = { muted: false, case: null, endDate: null };
}
