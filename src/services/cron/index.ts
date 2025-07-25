import { CronJob } from "cron";
import logger from "../../helpers/logger.js";
import { CronTaskData } from "@/types.js";

export class CronManager {
	private static instance: CronManager;
	private jobs = new Map<string, { job: CronJob; isRunning: boolean; isError: boolean }>();

	private constructor() {}

	public static getInstance(): CronManager {
		if (!CronManager.instance) {
			CronManager.instance = new CronManager();
		}
		return CronManager.instance;
	}

	async init(tasks: CronTaskData[]) {
		if (!tasks.length) return logger.warn("No cron tasks to schedule.");

		this.stopAll();

		for (const task of tasks) {
			if (this.jobs.has(task.name)) {
				logger.warn(`Cron task "${task.name}" is already registered.`);
				continue;
			}

			const job = new CronJob(
				task.schedule,
				async () => {
					const jobInfo = this.jobs.get(task.name);
					if (!jobInfo || jobInfo.isError) return;

					try {
						this.jobs.set(task.name, { ...jobInfo, isRunning: true });

						await task.task();

						this.jobs.set(task.name, { ...jobInfo, isRunning: false, isError: false });
					} catch (error) {
						logger.error(`Error executing cron task "${task.name}":`, error);

						this.jobs.set(task.name, { ...jobInfo, isRunning: false, isError: true });
					}
				},
				null,
				false,
				"Europe/Moscow",
			);

			job.start();
			this.jobs.set(task.name, {
				job,
				isRunning: false,
				isError: false,
			});
		}
		logger.log(`Scheduled ${this.jobs.size} cron tasks`);
	}

	stopAll() {
		if (!this.jobs.size) return;

		for (const [name, jobInfo] of this.jobs.entries()) {
			jobInfo.job.stop();

			logger.debug(`Stopped cron task "${name}"`);
		}

		this.jobs.clear();

		logger.log("All cron jobs stopped and cleared.");
	}
}
