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

	@ManyToOne(() => Guild)
	guildID!: string;

	@Property({ type: "int", default: 0 })
	money = 0;

	@Property({ type: "int", default: 0 })
	workStreak = 0;

	@Property({ type: "int", default: 0 })
	bankSold = 0;

	@Property({ type: "int", default: 0 })
	exp = 0;

	@Property({ type: "int", default: 0 })
	level = 0;

	@Property({ type: "json" }) // Храним как JSON-массив
	transactions: Transaction[] = [];

	@Property({ type: "int", onCreate: () => Date.now() }) // Дефолтное значение
	registeredAt!: number;

	@Property({ type: "json" }) // Объект как JSON
	cooldowns: Cooldowns = { work: 0, rob: 0 };

	@Property({ type: "json", default: [] }) // Массив массивов
	sanctions: any[][] = [];

	@Property({ type: "json" }) // Объект
	mute: Mute = { muted: false, case: null, endDate: null };
}
