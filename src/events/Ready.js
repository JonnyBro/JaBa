import logger from "../helpers/logger.js";
import { resolve } from "node:path";
import loadCronTasks from "../utils/loadCronTasks.js";
import { CronManager } from "../services/cron/index.js";

export const data = {
	name: "ready",
	once: true,
};

/**
 *
 * @param {import("../structures/client.js").ExtendedClient} client
 */
export async function run(client) {
	logger.ready(client.user.tag + " is online!");

	// Fetching all app emojis, because we need to use them
	await client.application.emojis.fetch();

	const taskPath = resolve(client.configService.get("paths.tasks"));

	const cronTasks = await loadCronTasks(taskPath);

	const cronManager = new CronManager(cronTasks);
	await cronManager.init();
}
