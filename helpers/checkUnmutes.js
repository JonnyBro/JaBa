const { EmbedBuilder } = require("discord.js");

/**
 *
 * @param {import("../base/JaBa")} client
 */
module.exports.init = async function (client) {
	client.membersData
		.find({ "mute.muted": true })
		.then(members => {
			members.forEach(member => client.databaseCache.mutedUsers.set(`${member.id}${member.guildID}`, member));
		});
	setInterval(async () => {
		client.databaseCache.mutedUsers.filter(m => m.mute.endDate <= Date.now())
			.forEach(async memberData => {
				const guild = client.guilds.cache.get(memberData.guildID);
				if (!guild) return;

				const member = guild.members.cache.get(memberData.id) || await guild.members.fetch(memberData.id).catch(() => {
					memberData.mute = {
						muted: false,
						endDate: null,
						case: null,
					};
					memberData.save();
					client.logger.log("[Unmuted] " + memberData.id + " cannot be found.");
					return;
				});

				const guildData = await client.findOrCreateGuild({
					id: guild.id,
				});

				if (member) {
					guild.channels.cache.forEach(channel => {
						const permOverwrites = channel.permissionOverwrites.cache.get(member.id);
						if (permOverwrites) permOverwrites.delete();
					});
				}

				const user = member ? member.user : await client.users.fetch(memberData.id);
				const embed = new EmbedBuilder()
					.setDescription(guild.translate("moderation/unmute:SUCCESS_CASE", {
						user: user.toString(),
						usertag: user.discriminator === "0" ? user.username : user.tag,
						count: memberData.mute.case,
					}))
					.setColor("#F44271")
					.setFooter({
						text: guild.client.config.embed.footer,
					});

				const channel = guild.channels.cache.get(guildData.plugins.modlogs);
				if (channel) channel.send({ embeds: [embed] });

				memberData.mute = {
					muted: false,
					endDate: null,
					case: null,
				};

				client.databaseCache.mutedUsers.delete(`${memberData.id}${memberData.guildID}`);
				await memberData.save();
			});
	}, 1000);
};