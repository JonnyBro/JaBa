import logger from "@/helpers/logger.js";
import { endPoll } from "@/helpers/polls.js";
import PollModel from "@/models/PollModel.js";
import { CronTaskData } from "@/types.js";

export const data: CronTaskData = {
	name: "endPolls",
	task: async () => {
		const polls = await PollModel.find({ ended: false, endsAt: { $lte: new Date() } }, { _id: 1 }).lean();

		for (const poll of polls)
			await endPoll(poll._id.toString()).catch(error =>
				logger.error(`[Polls] Failed to end ${poll._id}:`, error),
			);
	},
	schedule: "* * * * *",
};
