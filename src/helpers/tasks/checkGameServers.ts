import { checkAllServers } from "@/helpers/game-servers.js";
import { CronTaskData } from "@/types.js";

export const data: CronTaskData = {
	name: "checkGameServers",
	task: checkAllServers,
	schedule: "* * * * *",
};
