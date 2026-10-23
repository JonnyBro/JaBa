import logger from "@/helpers/logger.js";
import { CronTaskData } from "@/types.js";
import { CronJob } from "cron";

type JobInfo = {
	job: CronJob;
	task: CronTaskData;
	isRunning: boolean;
	lastRun: number | null;
	lastDuration: number | null;
	lastError: string | null;
};

export class CronManager {
	private static instance: CronManager;
	private jobs = new Map<string, JobInfo>();

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

			const job = new CronJob(task.schedule, () => void this.execute(task.name), null, false, "Europe/Moscow");

			job.start();

			this.jobs.set(task.name, {
				job,
				task,
				isRunning: false,
				lastRun: null,
				lastDuration: null,
				lastError: null,
			});

			logger.debug(`Task ${task.name} started`);
		}

		logger.info(`Scheduled ${this.jobs.size} cron task(s)`);
	}

	/** Runs the task now, unless it is already running. Returns false when it was skipped */
	async execute(name: string) {
		const jobInfo = this.jobs.get(name);
		// Frequent tasks must not overlap with a previous run that is still going
		if (!jobInfo || jobInfo.isRunning) return false;

		const startedAt = Date.now();
		jobInfo.isRunning = true;

		try {
			await jobInfo.task.task();
			jobInfo.lastError = null;
		} catch (error) {
			logger.error(`Error executing cron task "${name}":`, error);
			jobInfo.lastError = error instanceof Error ? error.message : String(error);
		} finally {
			jobInfo.isRunning = false;
			jobInfo.lastRun = startedAt;
			jobInfo.lastDuration = Date.now() - startedAt;
		}

		return true;
	}

	list() {
		return [...this.jobs.entries()].map(([name, info]) => ({
			name,
			schedule: info.task.schedule,
			isRunning: info.isRunning,
			lastRun: info.lastRun,
			lastDuration: info.lastDuration,
			lastError: info.lastError,
			nextRun: info.job.nextDate().toMillis(),
		}));
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
