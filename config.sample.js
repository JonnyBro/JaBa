module.exports = {
	/* The token of your Discord Bot */
	token: "XXXXXXXXXXX",
	/* ID of Bot's user */
	userId: "XXXXXXXXXXX",
	/* Set to true for production */
	production: true,
	/* For the support server */
	support: {
		id: "XXXXXXXXXXX", // The ID of the support server
		logs: "XXXXXXXXXXX", // And the ID of the logs channel of your server (new servers for example)
		invite: "", // Invite link to your support server
	},
	/* Dashboard configuration */
	dashboard: {
		enabled: true, // Whether the dashboard is enabled or not
		maintanceKey: "", // Your maintance key
		port: 80, // Dashboard port
		domain: "http://localhost", // The base URL of the dashboard without / at the end
		secret: "", // Your Discord Client's Secret
		logs: "", // The channel ID for logs
	},
	mongoDB: "mongodb://localhost:27017/discordbot", // The URl of the mongodb database
	/* For the embeds (embeded messages) */
	embed: {
		color: "#0091fc", // The default color for the embeds
		footer: {
			text: "Bot | v" + require("./package.json").version,
		}, // And the default footer for the embeds
	},
	/* Bot's owner informations */
	owner: {
		id: "XXXXXXXXXXX", // The ID of the bot's owner
		name: "XXXXXXXXXXX#1234", // And the name of the bot's owner
	},
	/* The API keys that are required for certain commands */
	apiKeys: {},
};