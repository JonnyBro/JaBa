module.exports = {
	/* The token of your Discord Bot */
	token: "XXXXXXXXXXX",
	/* ID of Bot's user */
	user: "XXXXXXXXXXX",
	/* For the support server */
	/* Set to true for production */
	production: true,
	support: {
		id: "XXXXXXXXXXX", // The ID of the support server
		logs: "XXXXXXXXXXX", // And the ID of the logs channel of your server (new servers for example)
	},
	/* Dashboard configuration */
	dashboard: {
		enabled: false, // whether the dashboard is enabled or not
		secret: "XXXXXXXXXXX", // Your discord client secret
		baseURL: "https://dashboard.example.com", // The base URl of the dashboard
		logs: "XXXXXXXXXXX", // The channel ID of logs
		port: 8080, // Dashboard port
		expressSessionPassword: "XXXXXXXXXXX", // Express session password (it can be what you want)
		failureURL: "https://dashboard.example.com" // url on which users will be redirected if they click the cancel button (discord authentication)
	},
	mongoDB: "mongodb://localhost:27017/discordbot", // The URl of the mongodb database
	/* For the embeds (embeded messages) */
	embed: {
		color: "#0091fc", // The default color for the embeds
		footer: "Bot | v1.0" // And the default footer for the embeds
	},
	/* Bot's owner informations */
	owner: {
		id: "XXXXXXXXXXX", // The ID of the bot's owner
		name: "XXXXXXXXXXX#1234" // And the name of the bot's owner
	},
	/* The API keys that are required for certain commands */
	apiKeys: {
		// AMETHYSTE: https://api.amethyste.moe
		amethyste: "XXXXXXXXXXX"
	}
};