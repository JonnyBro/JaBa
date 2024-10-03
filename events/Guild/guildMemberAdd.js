const BaseEvent = require("../../base/BaseEvent");

class GuildMemberAdd extends BaseEvent {
	constructor() {
		super({
			name: "guildMemberAdd",
			once: false,
		});
	}

	/**
	 *
	 * @param {import("../../base/Client")} client
	 * @param {import("discord.js").GuildMember} member
	 */
	async execute(client, member) {
		await member.guild.members.fetch();

		const guildData = await client.getGuildData(member.guild.id);

		if (guildData.plugins.autorole.enabled) {
			const role = guildData.plugins.autorole.role;
			if (role) {
				await member.roles.add(role).catch(err => {
					client.logger.error(`Failed to add role to ${member.user.tag}: ${err}`);
				});
			}
		}

		if (guildData.plugins.welcome.enabled) {
			const channel = member.guild.channels.cache.get(guildData.plugins.welcome.channel);

			if (channel) {
				const message = guildData.plugins.welcome.message
					.replace(/{user}/g, member)
					.replace(/{server}/g, member.guild.name)
					.replace(/{membercount}/g, member.guild.memberCount);

				await channel.send({ content: message }).catch(err => {
					client.logger.error(`Failed to send welcome message in channel ${channel.id}: ${err}`);
				});
			} else {
				client.logger.warn(`Welcome channel not found: ${guildData.plugins.welcome.channel}`);
			}
		}
	}
}

module.exports = GuildMemberAdd;
