import logger from "../helpers/logger.js";

export const data = {
	name: "ready",
	once: true,
};

/**
 *
 * @param {import("../structures/client.js").ExtendedClient} client
 */
export async function run(client) {
	logger.ready(client.user.tag + " is online!");
}
