import { endGiveaway } from "@/helpers/giveaways.js";
import logger from "@/helpers/logger.js";
import GiveawayModel from "@/models/GiveawayModel.js";
import { CronTaskData } from "@/types.js";

export const data: CronTaskData = {
	name: "endGiveaways",
	task: async () => {
		const giveaways = await GiveawayModel.find({ ended: false, endsAt: { $lte: new Date() } }, { _id: 1 }).lean();

		for (const giveaway of giveaways)
			await endGiveaway(giveaway._id.toString()).catch(error =>
				logger.error(`[Giveaways] Failed to end ${giveaway._id}:`, error),
			);
	},
	schedule: "* * * * *",
};
