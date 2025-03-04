import { CronTaskData } from "@/types.js";
import logger from "../helpers/logger.js";
import { getFilePaths } from "./get-path.js";
import { toFileURL } from "./resolve-file.js";

const loadCronTasks = async (taskPath: string): Promise<CronTaskData[]> => {
	try {
		const filePaths = (await getFilePaths(taskPath, true)).filter(file => file.endsWith(".js") || file.endsWith(".ts"));
		const tasks = [];

		for (const filePath of filePaths) {
			const { data } = (await import(toFileURL(filePath))) as { data: CronTaskData };

			if (!data) continue;

			if (!data.name) {
				logger.warn("No name found in task:", filePath);
				continue;
			}

			if (!data.schedule) {
				logger.warn("No schedule found in task:", filePath);
				continue;
			}

			if (typeof data.task !== "function") {
				logger.warn("Task is not a function:", filePath);
				continue;
			}

			tasks.push(data);
		}

		return tasks;
	} catch (error) {
		logger.error("Error loading cron tasks:", error);
		return [];
	}
};

export default loadCronTasks;
