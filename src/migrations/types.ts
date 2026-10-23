import mongoose from "mongoose";

export type Migration = {
	id: string;
	description: string;
	up: (db: mongoose.mongo.Db) => Promise<void>;
};
