const BaseEvent = require("../../base/BaseEvent");

class GuildMemberUpdate extends BaseEvent {
	constructor() {
		super({
			name: "guildMemberRemove",
			once: false
		});
	}

	/**
	 *
	 * @param {import("discord.js").GuildMember} oldMember
	 * @param {import("discord.js").GuildMember} newMember
	 */
	async execute(oldMember, newMember) {
		if (oldMember.guild && oldMember.guild.id === "568120814776614924") return;

		if (oldMember.guild.id !== this.client.config.support.id) return;
		if (oldMember.roles.cache.some((r) => r.name === "Поддержавшие JaBa")) return;
		if (newMember.roles.cache.some((r) => r.name === "Поддержавшие JaBa")) {
			const userData = await this.client.findOrCreateUser({
				id: newMember.id
			});
			userData.achievements.tip.progress.now = 1;
			userData.achievements.tip.achieved = true;
			userData.markModified("achievements.tip");
			await userData.save();

			newMember.send({
				files: [{
					name: "achievement_unlocked5.png",
					attachment: "./assets/img/achievements/achievement_unlocked5.png"
				}]
			});
		}
	}
}

module.exports = GuildMemberUpdate;