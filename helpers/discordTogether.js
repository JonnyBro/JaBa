/*
	Thanks to discord-together =)
	List of IDs from here: https://gist.github.com/GeneralSadaf/42d91a2b6a93a7db7a39208f2d8b53ad
*/
const fetch = require("node-fetch");

const defaultApplications = [
	{ id: "880218394199220334", name: "Watch Together", nitro_requirement: false, premium_tier_level: 0, max_participants: -1, use: true },
	{ id: "902271654783242291", name: "Sketch Heads", nitro_requirement: false, premium_tier_level: 0, max_participants: 8, use: true },
	{ id: "879863976006127627", name: "Word Snacks", nitro_requirement: false, premium_tier_level: 0, max_participants: 8, use: true },
	{ id: "878067389634314250", name: "Doodle Crew", nitro_requirement: false, premium_tier_level: 0, max_participants: 16, use: true }, // not in Discord Games Lab guild
	{ id: "755827207812677713", name: "Poker Night", nitro_requirement: false, premium_tier_level: 1, max_participants: 7, use: true },
	{ id: "832012774040141894", name: "Chess In The Park", nitro_requirement: false, premium_tier_level: 1, max_participants: -1, use: true },
	{ id: "879863686565621790", name: "Letter League", nitro_requirement: false, premium_tier_level: 1, max_participants: 8, use: true },
	{ id: "852509694341283871", name: "SpellCast", nitro_requirement: false, premium_tier_level: 1, max_participants: 6, use: true },
	{ id: "832013003968348200", name: "Checkers In The Park", nitro_requirement: false, premium_tier_level: 1, max_participants: -1, use: true },
	{ id: "832025144389533716", name: "Blazing 8s", nitro_requirement: false, premium_tier_level: 1, max_participants: 8, use: true },
	{ id: "945737671223947305", name: "Putt Party", nitro_requirement: false, premium_tier_level: 1, max_participants: 8, use: true },
	{ id: "903769130790969345", name: "Land-io", nitro_requirement: false, premium_tier_level: 1, max_participants: 16, use: true },
	{ id: "947957217959759964", name: "Bobble League", nitro_requirement: false, premium_tier_level: 1, max_participants: 8, use: true },
	{ id: "976052223358406656", name: "Ask Away", nitro_requirement: false, premium_tier_level: 1, max_participants: 10, use: true },
	{ id: "950505761862189096", name: "Know What I Meme", nitro_requirement: false, premium_tier_level: 1, max_participants: 8, use: true },

	// not public
	/*
	{ id: "773336526917861400", name: "Betrayal.io", nitro_requirement: false, premium_tier_level: 0, max_participants: null, use: false },
	{ id: "814288819477020702", name: "Fishington.io", nitro_requirement: false, premium_tier_level: 0, max_participants: null, use: false },
	{ id: "879864070101172255", name: "Sketchy Artist", nitro_requirement: false, premium_tier_level: 0, max_participants: 12, use: false },
	{ id: "879863881349087252", name: "Awkword", nitro_requirement: false, premium_tier_level: 0, max_participants: 12, use: false },
	*/
];

/**
 * Class symbolizing a DiscordTogether
 * @template {Object.<String, String>} T
 */
class DiscordTogether {
	/**
	 * Create a new DiscordTogether
	 * @param {import("../base/JaBa")} client
	 * @param {T} applications
	 * @example
	 * const Discord = require("discord.js");
	 * const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES] });
	 * const { DiscordTogether } = require("discord-together");
	 *
	 * client.discordTogether = new DiscordTogether(client);
	 *
	 * client.on("message", async message => {
	 *      if (message.content === "start") {
	 *          client.discordTogether.createTogetherCode(message.member.voice.channelID, "puttparty").then(async invite => {
	 *              return message.channel.send(`${invite.code}`);
	 *           });
	 *      };
	 * });
	 *
	 * client.login("your token");
	 */
	constructor(client) {
		if (!client) throw new SyntaxError("Invalid Discord.Client !");

		/**
		 * Discord.Client
		 */
		this.client = client;

		/**
		 * Discord Together applications
		 */
		this.applications = defaultApplications;
	}

	/**
	 * Create a Discord Together invite code (note: send the invite using markdown link)
	 * @param {String} voiceChannelId
	 * @param {keyof (defaultApplications & T)} option
	 * @example
	 * client.on("message", async message => {
	 *      if (message.content === "start") {
	 *          client.discordTogether.createTogetherCode(message.member.voice.channelID, "youtube").then(async invite => {
	 *              return message.channel.send(`${invite.code}`); // Click the blue link
	 *           });
	 *      };
	 * });
	 * @returns {Promise<{ code: String; }>}
	 */
	async createTogetherCode(voiceChannelId, option) {
		/**
		 * @param {String} code The invite link (only use the blue link)
		 */
		const returnData = { code: "none" };

		if (option && this.applications.find(apps => apps.id === option).id) {
			const applicationID = this.applications.find(apps => apps.id === option).id;
			try {
				await fetch(`https://discord.com/api/v10/channels/${voiceChannelId}/invites`, {
					method: "POST",
					body: JSON.stringify({
						max_age: 86400,
						max_uses: 0,
						temporary: false,
						target_type: 2,
						target_application_id: applicationID
					}),
					headers: {
						Authorization: `Bot ${this.client.config.token}`,
						"Content-Type": "application/json",
					},
				}).then(res => res.json())
					.then(invite => {
						if (invite.error || !invite.code) throw new Error("An error occured while retrieving data!");
						if (Number(invite.code) === 50013) console.warn("Your bot lacks permissions to perform that action");
						returnData.code = `https://discord.com/invite/${invite.code}`;
					});
			} catch (err) {
				throw new Error("An error occured while starting Youtube together !");
			}
			return returnData;
		} else {
			throw new SyntaxError("Invalid option!");
		}
	}
}

module.exports = { DiscordTogether, defaultApplications };