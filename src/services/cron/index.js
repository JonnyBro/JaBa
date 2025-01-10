import { CronJob } from "cron";
import logger from "../../helpers/logger.js";

export class CronManager {
	constructor(tasks) {
		this.tasks = tasks;
		this.jobs = new Map();
	}

	async init() {
		if (!this.tasks.length) {
			logger.warn("No cron tasks to schedule.");
			return;
		}

		for (const task of this.tasks) {
			const taskJob = this.jobs.get(task.name);
			if (taskJob?.isRunning) {
				logger.warn(`Cron task "${task.name}" is already running.`);
				continue;
			}

			const job = new CronJob(
				task.schedule,
				async () => {
					if (this.jobs.get(task.name)?.isError) {
						return;
					}

					try {
						await task.task();
					} catch (error) {
						logger.error(`Error executing cron task "${task.name}":`, error);
						this.jobs.get(task.name).isError = true;
					}
				},
				null,
				false,
				"Europe/Moscow",
			);

			job.start();
			this.jobs.set(task.name, {
				job,
				isRunning: true,
				isError: false,
			});
		}
		logger.log(`Cron tasks scheduled: ${this.jobs.size}`);
	}

	stopAll() {
		if (!this.jobs.length) return;

		// eslint-disable-next-line no-unused-vars
		for (const [_, jobInfo] of this.jobs.entries()) {
			jobInfo.job.stop();
		}
		logger.log("All cron jobs stopped.");
	}
}
