import { PROJECT_ROOT } from "@/constants/index.js";
import { getNoun, getUsername } from "@/helpers/functions.js";
import logger from "@/helpers/logger.js";
import { applySavedSessions } from "@/helpers/music-resume.js";
import { startPresenceRotation } from "@/helpers/presence.js";
import { CronManager } from "@/services/cron/index.js";
import { ExtendedClient } from "@/structures/client.js";
import loadCronTasks from "@/utils/loadCronTasks.js";
import { startDashboard } from "@/web/index.js";
import { join } from "node:path";

export const data = {
	name: "clientReady",
	once: true,
};

export async function run(client: ExtendedClient) {
	const guildsCount = client.guilds.cache.size;

	logger.ready(
		`${getUsername(client.user)} is online! Serving ${guildsCount} ${getNoun(guildsCount, [
			client.i18n.translate("misc:NOUNS:SERVER:1"),
			client.i18n.translate("misc:NOUNS:SERVER:2"),
			client.i18n.translate("misc:NOUNS:SERVER:5"),
		])}`,
	);

	await client.application.emojis.fetch();
	await applySavedSessions();
	await client.lavalink.init({ id: client.user.id, username: client.user.username });

	const tasksPath = join(PROJECT_ROOT, "helpers", "tasks");
	const cronTasks = await loadCronTasks(tasksPath);
	const cronManager = CronManager.getInstance();
	await cronManager.init(cronTasks);

	await startDashboard().catch(error => logger.error("[Dashboard] Failed to start:", error));

	startPresenceRotation();
}
