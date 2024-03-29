const mongoose = require("mongoose"),
	Schema = mongoose.Schema,
	languages = require("../languages/language-meta.json");

module.exports = mongoose.model("Guild", new Schema({
	id: { type: String },

	membersData: { type: Object, default: {} },
	members: [{ type: Schema.Types.ObjectId, ref: "Member" }],

	language: { type: String, default: languages.find(l => l.default).name },
	plugins: {
		type: Object,
		default: {
			welcome: {
				enabled: false,
				message: null,
				channel: null,
				withImage: null,
			},
			goodbye: {
				enabled: false,
				message: null,
				channel: null,
				withImage: null,
			},
			autorole: {
				enabled: false,
				role: null,
			},
			automod: {
				enabled: false,
				ignored: [],
			},
			warnsSanctions: {
				kick: null,
				ban: null,
			},
			monitoring: {
				messageUpdate: null,
				messageDelete: null,
			},
			tickets: {
				count: 0,
				ticketLogs: null,
				transcriptionLogs: null,
				ticketsCategory: null,
			},
			suggestions: null,
			reports: null,
			birthdays: null,
			modlogs: null,
		},
	},
}));
