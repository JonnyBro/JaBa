import logger from "@/helpers/logger.js";
import { CronTaskData } from "@/types.js";
import { CronJob } from "cron";

export class CronManager {
	private static instance: CronManager;
	private jobs = new Map<string, { job: CronJob; isRunning: boolean }>();

	private constructor() {}

	public static getInstance(): CronManager {
		if (!CronManager.instance) CronManager.instance = new CronManager();
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
					if (!jobInfo || jobInfo.isRunning) return;

					jobInfo.isRunning = true;

					try {
						await task.task();
					} catch (error) {
						logger.error(`Error executing cron task "${task.name}":`, error);
					} finally {
						jobInfo.isRunning = false;
					}
				},
				null,
				false,
				"Europe/Moscow",
			);

			job.start();

			this.jobs.set(task.name, { job, isRunning: false });

			logger.debug(`Task ${task.name} started`);
		}

		logger.info(`Scheduled ${this.jobs.size} cron task(s)`);
	}

	stopAll() {
		if (!this.jobs.size) return;

		for (const [name, jobInfo] of this.jobs.entries()) {
			jobInfo.job.stop();

			logger.log(`Stopped cron task "${name}"`);
		}

		this.jobs.clear();

		logger.info("All cron jobs stopped and cleared.");
	}
}
