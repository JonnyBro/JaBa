export const data = {
	name: "ready",
	once: true,
};

export async function run(client) {
	console.log(client.user.tag + " is online!");
}
