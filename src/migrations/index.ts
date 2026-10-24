import logger from "@/helpers/logger.js";
import mongoose from "mongoose";
import memberBankSold from "./001-member-bank-sold.js";
import userBirthdateMs from "./002-user-birthdate-ms.js";
import guildBirthdaysNull from "./003-guild-birthdays-null.js";
import guildLanguage from "./004-guild-language.js";
import dedupeAndUniqueIndexes from "./005-dedupe-and-unique-indexes.js";
import removeLegacyData from "./006-remove-legacy-data.js";
import normalizeDocuments from "./007-normalize-documents.js";
import removeInvalidIds from "./008-remove-invalid-ids.js";
import { Migration } from "./types.js";

// Append only, never reorder or edit migrations that have already been applied
const migrations: Migration[] = [
	memberBankSold,
	userBirthdateMs,
	guildBirthdaysNull,
	guildLanguage,
	dedupeAndUniqueIndexes,
	removeLegacyData,
	normalizeDocuments,
	removeInvalidIds,
];

export const runMigrations = async () => {
	const db = mongoose.connection.db;
	if (!db) throw new Error("Migrations: database is not connected");

	const collection = db.collection<{ _id: string; appliedAt: Date }>("migrations");
	const applied = new Set((await collection.find().toArray()).map(m => m._id));
	const pending = migrations.filter(m => !applied.has(m.id));

	if (!pending.length) return logger.debug("[Migrations] Database is up to date");

	for (const migration of pending) {
		logger.info(`[Migrations] Running ${migration.id}: ${migration.description}`);

		await migration.up(db);
		await collection.insertOne({ _id: migration.id, appliedAt: new Date() });
	}

	logger.info(`[Migrations] Applied ${pending.length} migration(s)`);
};

export const getMigrationStatus = async () => {
	const applied = new Map(
		(await mongoose.connection.db!.collection<{ _id: string; appliedAt: Date }>("migrations").find().toArray()).map(
			m => [m._id, m.appliedAt.getTime()],
		),
	);

	return migrations.map(m => ({ id: m.id, description: m.description, appliedAt: applied.get(m.id) ?? null }));
};
