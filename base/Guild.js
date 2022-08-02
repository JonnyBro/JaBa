const mongoose = require("mongoose"),
	Schema = mongoose.Schema,
	languages = require("../languages/language-meta.json");

module.exports = mongoose.model("Guild", new Schema({
	/* REQUIRED */
	id: { type: String }, // Discord ID of the guild

	/* MEMBERSDATA */
	membersData: { type: Object, default: {} }, // Members data of the guild
	members: [{ type: Schema.Types.ObjectId, ref: "Member" }],

	/* CONFIGURATION */
	language: { type: String, default: languages.find((l) => l.default).name }, // Language of the guild
	plugins: { type: Object, default: { // Plugins data
		// Welcome messages
		welcome: {
			enabled: false, // Whether the welcome messages are enabled
			message: null, // The welcome message
			channel: null, // The channel to send the welcome messages
			withImage: null // Whether the welcome images are enabled
		},
		// Goodbye messages
		goodbye: {
			enabled: false, // Whether the goodbye messages are enabled
			message: null, // The goodbye message
			channel: null, // The channel to send the goodbye messages
			withImage: null // Whether the goodbye images are enabled
		},
		// Autorole
		autorole: {
			enabled: false, // Whether the autorole is enabled
			role: null // The role to add when a member join the server
		},
		// Auto moderation
		automod: {
			enabled: false, // Whether the auto moderation is enabled
			ignored: [] // The channels in which the auto moderation is disabled
		},
		// Auto sanctions
		warnsSanctions: {
			kick: false, // The number of warns required to kick the user
			ban: false // The number of warns required to ban the user
		},
		suggestions: false, // the channel in which the suggestions will be sent
		modlogs: false, // the channel in which the moderation logs (mute, kick, ban, etc...) will be sent
		birthdays: false, // the channel in which birtdays announcements will be sent
		reports: false, // the channel in which the reports will be sent
		logs: false // the channel in which the logs (message deleted, etc...) will be sent
	}},
	casesCount: { type: Number, default: 0 },
	autoDeleteModCommands: { type: Boolean, default: false }, // Whether to auto delete moderation commands
}));