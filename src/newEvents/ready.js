import logger from "../helpers/logger.js";

export const data = {
	name: "ready",
	once: true,
};

/**
 *
 * @param {import("../base/Client.JaBaClient")} client
 */
export async function run(client) {
	logger.log(client.user.tag + " is online!");
}
