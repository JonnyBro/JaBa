const BaseEvent = require("../../base/BaseEvent");

class GuildMemberUpdate extends BaseEvent {
	constructor() {
		super({
			name: "guildMemberUpdate",
			once: false,
		});
	}

	/**
	 *
	 * @param {import("../../base/Client")} client
	 * @param {import("discord.js").GuildMember} oldMember
	 * @param {import("discord.js").GuildMember} newMember
	 */
	async execute(client, oldMember, newMember) {
		if (oldMember.guild.id !== client.config.support.id) return;
		if (oldMember.roles.cache.some(r => r.id === "940149470975365191")) return;

		if (newMember?.roles.cache.some(r => r.id === "940149470975365191")) {
			const userData = await client.getUserData(newMember.id);

			userData.achievements.tip.progress.now = 1;
			userData.achievements.tip.achieved = true;

			await userData.save().catch(err => {
				client.logger.error(`Failed to save user data for ${newMember.id}: ${err}`);
			});

			try {
				await newMember.send({
					files: [
						{
							name: "achievement_unlocked5.png",
							attachment: "./assets/img/achievements/achievement_unlocked5.png",
						},
					],
				});
			} catch (err) {
				client.logger.error(`Failed to send achievement message to ${newMember.id}: ${err}`);
			}
		}
	}
}

module.exports = GuildMemberUpdate;
