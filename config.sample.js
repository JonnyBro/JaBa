module.exports = {
	/* The token of your Discord Bot */
	token: "XXXXXXXXXXXXXXXXXXXXXXXXXXXX",
	/* UserID of your Discord Bot */
	userId: "XXXXXXXXXXXXXXXXXXXXXXXXXXXX",
	/* The URL of the MongoDB database */
	mongoDB: "mongodb://127.0.0.1:27017/discordbot",
	/* Set to true for production */
	/* If set to false, commands only will be registered on the support.id server */
	production: true,
	/* Spotify */
	spotify: {
		clientId: "XXXXXXXXXXXXXXXXXXXXXXXXXXXX",
		clientSecret: "XXXXXXXXXXXXXXXXXXXXXXXXXXXX",
	},
	/* YouTube Cookie */
	youtubeCookie: "XXXXXXXXXXXXXXXXXXXXXXXXXXXX",
	/* Support server */
	support: {
		id: "123456789098765432", // The ID of the support server
		logs: "123456789098765432", // The channel's ID for logs on the support server (when bot joins or leaves a guild)
		invite: "https://discord.gg/discord", // Invite link to the support server
	},
	/* Dashboard configuration */
	dashboard: {
		enabled: false, // Whether the dashboard is enabled or not
		maintanceKey: "letmein", // Maintance key
		port: 80, // Dashboard port
		domain: "http://localhost", // The base URL of the dashboard without / at the end
		secret: "XXXXXXXXXXXXXXXXXXXXXXXXXXXX", // Your Bot's Client Secret
		logs: "123456789098765432", // The channel ID for logs
	},
	/* Embeds defaults */
	embed: {
		color: "#00FF00", // Color
		footer: {
			text: "My Discord Bot | v" + require("./package.json").version, // Footer text
		},
	},
	/* Bot's owner informations */
	owner: {
		id: "123456789098765432", // The ID of the bot's owner
	},
	/* Add your own API keys here */
	apiKeys: {
		shlink: "12345678-1234-1234-1234-123456789098" /* Shlink.io REST API key */,
	},
};
