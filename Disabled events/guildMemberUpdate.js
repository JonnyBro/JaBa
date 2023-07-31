// const { EmbedBuilder } = require("discord.js"),
// 	BaseEvent = require("../../base/BaseEvent");

// class messageDelete extends BaseEvent {
// 	constructor() {
// 		super({
// 			name: "messageDelete",
// 			once: false,
// 		});
// 	}

// 	/**
// 	 *
// 	 * @param {import("../../base/JaBa")} client The Discord Client
// 	 * @param {import("discord.js").GuildMember} oldMember The member before the update
// 	 * @param {import("discord.js").GuildMember} newMember The member after the update
// 	 */
// 	async execute(client, oldMember, newMember) {
// 		if (oldMember.guild && oldMember.guild.id === "568120814776614924") return;
// 		if (oldMember.user.bot) return;

// 		const guildData = await client.findOrCreateGuild({ id: oldMember.guild.id });

// 		if (guildData.plugins?.monitoring?.messageDelete) {
// 			const embed = new EmbedBuilder()
// 				.setAuthor({
// 					name: message.author.getUsername(),
// 					iconURL: message.author.displayAvatarURL(),
// 				})
// 				.setColor(client.config.embed.color)
// 				.setFooter(client.config.embed.footer)
// 				.setTitle(`${message.author.getUsername()} deleted a message!`)
// 				.setDescription(`Message content was: \`\`\`${message.content}\`\`\``);

// 			message.guild.channels.cache.get(guildData.plugins.monitoring.messageDelete).send({
// 				embeds: [embed],
// 			});
// 		}
// 	}
// }

// module.exports = messageDelete;
