const BaseEvent = require("../../base/BaseEvent");

class GuildMemberUpdate extends BaseEvent {
	constructor() {
		super({
			name: "guildMemberRemove",
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
		if (oldMember.guild && oldMember.guildId === "568120814776614924") return;
		if (oldMember.guild.id !== client.config.support.id) return;
		if (oldMember.roles.cache.some(r => r.id === "940149470975365191")) return;

		if (newMember?.roles.cache.some(r => r.id === "940149470975365191")) {
			const userData = await client.getUserData(newMember.id);

			userData.achievements.tip.progress.now = 1;
			userData.achievements.tip.achieved = true;

			await userData.save();

			newMember.send({
				files: [
					{
						name: "achievement_unlocked5.png",
						attachment: "./assets/img/achievements/achievement_unlocked5.png",
					},
				],
			});
		}
	}
}

module.exports = GuildMemberUpdate;
