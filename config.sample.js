module.exports = {
	/* The token of your Discord Bot */
	token: "XXXXXXXXXXXXXXXXXXXXXXXXXXXX",
	/* ID of Bot's user */
	userId: "123456789098765432",
	/* Set to true for production */
	/* If set to false, commands only will be registered on the support.id server */
	production: true,
	/* For the support server */
	support: {
		id: "123456789098765432", // The ID of the support server
		logs: "123456789098765432", // And the ID of the logs channel of your server (new servers for example)
		invite: "https://discord.gg/discord", // Invite link to your support server
	},
	/* Dashboard configuration */
	dashboard: {
		enabled: false, // Whether the dashboard is enabled or not
		maintanceKey: "letmein", // Your maintance key
		port: 80, // Dashboard port
		domain: "http://localhost", // The base URL of the dashboard without / at the end
		secret: "XXXXXXXXXXXXXXXXXXXXXXXXXXXX", // Your Bot's Client Secret
		logs: "123456789098765432", // The channel ID for logs
	},
	mongoDB: "mongodb://127.0.0.1:27017/discordbot", // The URL of the MongoDB database
	/* For the embeds */
	embed: {
		color: "#00FF00", // The default color for the embeds
		footer: {
			text: "My Discord Bot | v" + require("./package.json").version,
		}, // And the default footer for the embeds
	},
	/* Bot's owner informations */
	owner: {
		id: "123456789098765432", // The ID of the bot's owner
	},
	/* The API keys that are required for certain commands */
	apiKeys: {},
};
