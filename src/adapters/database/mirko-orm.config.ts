import { defineConfig, MongoDriver } from "@mikro-orm/mongodb";

export default defineConfig({
	entities: ["dist/models/**/*.js"],
	entitiesTs: ["src/models/**/*.ts"],
	debug: process.env.NODE_ENV !== "production",
	forceEntityConstructor: true,
	dbName: "discordbot",
	driver: MongoDriver,
});
