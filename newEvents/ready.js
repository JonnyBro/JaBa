import Event from "../base/newEvent.js";

export default new Event(
	{
		name: "ready",
		once: true,
	},
	client => {
		console.log(client.user.tag + " is online!");
	},
);
