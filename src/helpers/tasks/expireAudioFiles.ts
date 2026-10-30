import { expireInactiveFiles } from "@/helpers/audio-files.js";
import logger from "@/helpers/logger.js";
import { CronTaskData } from "@/types.js";

export const data: CronTaskData = {
	name: "expireAudioFiles",
	task: async () => {
		const { expired, orphans } = await expireInactiveFiles();

		if (expired || orphans)
			logger.info(`[Files] Deleted ${expired} inactive and ${orphans} unused uploaded file(s)`);
	},
	schedule: "0 0 * * *",
};
