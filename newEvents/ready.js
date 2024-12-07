export const data = {
	name: "ready",
	once: true,
};

/**
 *
 * @param {import("../base/Client.JaBaClient")} client
 */
export async function run(client) {
	console.log(client.user.tag + " is online!");
}
