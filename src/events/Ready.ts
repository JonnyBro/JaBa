import { getUsername } from "@/helpers/extenders.js";
import { getNoun } from "@/helpers/functions.js";
import logger from "@/helpers/logger.js";
import { CronManager } from "@/services/cron/index.js";
import { ExtendedClient } from "@/structures/client.js";
import loadCronTasks from "@/utils/loadCronTasks.js";
import { ActivityType } from "discord.js";
import { resolve } from "node:path";

export const data = {
	name: "ready",
	once: true,
};

export async function run(client: ExtendedClient) {
	let guildsCount = client.guilds.cache.size;

	const status = [
		"Use /help to see all the commands!",
		`I'm in ${guildsCount} ${getNoun(guildsCount, [
			client.i18n.translate("misc:NOUNS:SERVER:1"),
			client.i18n.translate("misc:NOUNS:SERVER:2"),
			client.i18n.translate("misc:NOUNS:SERVER:5"),
		])}!`,
	];

	logger.ready(
		`${getUsername(client.user)} is online! Serving ${guildsCount} ${getNoun(guildsCount, [
			client.i18n.translate("misc:NOUNS:SERVER:1"),
			client.i18n.translate("misc:NOUNS:SERVER:2"),
			client.i18n.translate("misc:NOUNS:SERVER:5"),
		])}`,
	);

	// Fetching all app emojis, because we need to use them
	await client.application.emojis.fetch();

	const tasksPath = resolve(client.configService.get("paths.tasks"));
	const cronTasks = await loadCronTasks(tasksPath);
	const cronManager = new CronManager(cronTasks);
	await cronManager.init();

	// Update guilds count
	let i = 0;
	setInterval(async () => {
		guildsCount = (await client.guilds.fetch()).size;

		client.user.setActivity({
			type: ActivityType.Custom,
			name: "custom",
			state: status[i],
		});

		i = (i + 1) % status.length; // Wrap around to the start when reaching the end
	}, 30 * 1000); // Every 30 seconds
}
