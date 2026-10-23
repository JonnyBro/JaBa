import logger from "@/helpers/logger.js";
import mongoose from "mongoose";
import { Migration } from "./types.js";

type Duplicate = { ids: mongoose.Types.ObjectId[]; money: number; bank: number };

// findOne() without a sort returns the oldest document, so that is the one the bot has been using
const findDuplicates = (collection: mongoose.mongo.Collection, key: Record<string, string>) =>
	collection
		.aggregate<Duplicate>([
			{ $sort: { _id: 1 } },
			{
				$group: {
					_id: key,
					ids: { $push: "$_id" },
					money: { $sum: { $ifNull: ["$money", 0] } },
					bank: { $sum: { $ifNull: ["$bank", 0] } },
					count: { $sum: 1 },
				},
			},
			{ $match: { count: { $gt: 1 } } },
		])
		.toArray();

const dedupe = async (db: mongoose.mongo.Db, name: string, key: Record<string, string>, mergeMoney = false) => {
	const collection = db.collection(name);
	const duplicates = await findDuplicates(collection, key);
	let removed = 0;

	for (const { ids, money, bank } of duplicates) {
		const [keep, ...rest] = ids;

		if (mergeMoney) await collection.updateOne({ _id: keep }, { $set: { money, bank } });

		removed += (await collection.deleteMany({ _id: { $in: rest } })).deletedCount;
	}

	logger.info(`[Migrations] Removed ${removed} duplicate(s) from ${name}`);
};

// Old versions created plain indexes with the same auto-generated names, Mongo refuses to change them in place
const ensureUniqueIndex = async (db: mongoose.mongo.Db, name: string, key: Record<string, 1>) => {
	const collection = db.collection(name);
	const existing = (await collection.indexes()).find(index => JSON.stringify(index.key) === JSON.stringify(key));

	if (existing?.unique) return;
	if (existing?.name) await collection.dropIndex(existing.name);

	await collection.createIndex(key, { unique: true });

	logger.info(`[Migrations] Created a unique index on ${name} (${Object.keys(key).join(", ")})`);
};

export default {
	id: "005-dedupe-and-unique-indexes",
	description: "Merge duplicated guilds, users and members and add unique indexes",
	up: async db => {
		await dedupe(db, "guilds", { id: "$id" });
		await dedupe(db, "users", { id: "$id" });
		await dedupe(db, "members", { id: "$id", guildID: "$guildID" }, true);

		// Not in the schemas: mongoose would build them on connect, before the duplicates are gone
		await ensureUniqueIndex(db, "guilds", { id: 1 });
		await ensureUniqueIndex(db, "users", { id: 1 });
		await ensureUniqueIndex(db, "members", { id: 1, guildID: 1 });
	},
} satisfies Migration;
