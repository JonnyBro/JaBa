const BaseEvent = require("../../base/BaseEvent");

class GuildCreate extends BaseEvent {
	constructor() {
		super({
			name: "guildCreate",
			once: false,
		});
	}

	/**
	 *
	 * @param {import("../../base/Client")} client
	 * @param {import("discord.js").Guild} guild
	 */
	async execute(client, guild) {
		const userData = await client.findOrCreateUser(guild.ownerId);

		if (!userData.achievements.invite.achieved) {
			userData.achievements.invite.progress.now = 1;
			userData.achievements.invite.achieved = true;

			userData.markModified("achievements");
			await userData.save();
		}

		const thanks = client.embed({
			author: "Thanks for inviting me to your server!",
			description: "Use </help:1029832476077596773> in your server to get list of all commands!.",
		});

		try {
			const owner = await guild.fetchOwner();
			owner.send({
				files: [
					{
						name: "unlocked.png",
						attachment: "./assets/img/achievements/achievement_unlocked7.png",
					},
				],
				embeds: [thanks],
			});
		} catch (e) { /**/ }

		if (client.config.support.logs) {
			const users = guild.members.cache.filter(m => !m.user.bot).size;
			const bots = guild.members.cache.filter(m => m.user.bot).size;

			const embed = client.embed({
				author: {
					name: guild.name,
					iconURL: guild.iconURL(),
				},
				description: `Joined a new guild **${guild.name}**. It has **${users}** ${client.functions.getNoun(users, client.translate("misc:NOUNS:USERS:1"), client.translate("misc:NOUNS:USERS:2"), client.translate("misc:NOUNS:USERS:5"))} and **${bots}** ${client.functions.getNoun(bots, client.translate("misc:NOUNS:BOTS:1"), client.translate("misc:NOUNS:BOTS:2"), client.translate("misc:NOUNS:BOTS:5"))}`,
			});

			client.channels.cache.get(client.config.support.logs).send({
				embeds: [embed],
			});
		}
	}
}

module.exports = GuildCreate;
