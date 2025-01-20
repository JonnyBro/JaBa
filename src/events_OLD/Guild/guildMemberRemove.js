import BaseEvent from "../../base/BaseEvent";

class GuildMemberRemove extends BaseEvent {
	constructor() {
		super({
			name: "guildMemberRemove",
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

		if (guildData.plugins.goodbye.enabled) {
			const channel = member.guild.channels.cache.get(guildData.plugins.goodbye.channel);

			if (channel) {
				const message = guildData.plugins.goodbye.message
					.replace(/{user}/g, member.user.getUsername())
					.replace(/{server}/g, member.guild.name)
					.replace(/{membercount}/g, member.guild.memberCount);

				await channel.send({ content: message }).catch(err => {
					client.logger.error(`Failed to send goodbye message in channel ${channel.id}: ${err}`);
				});
			} else {
				client.logger.warn(`Goodbye channel not found: ${guildData.plugins.goodbye.channel}`);
			}
		}
	}
}

export default GuildMemberRemove;
