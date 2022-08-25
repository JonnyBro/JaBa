const { EmbedBuilder } = require("discord.js"),
	BaseEvent = require("../../base/BaseEvent");

class GuildCreate extends BaseEvent {
	constructor() {
		super({
			name: "guildCreate",
			once: false
		});
	}

	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 * @param {import("discord.js").Guild} guild
	 */
	async execute(client, guild) {
		const messageOptions = {};

		const userData = await client.findOrCreateUser({
			id: guild.ownerId
		});

		if (!userData.achievements.invite.achieved) {
			userData.achievements.invite.progress.now += 1;
			userData.achievements.invite.achieved = true;
			messageOptions.files = [{
				name: "unlocked.png",
				attachment: "./assets/img/achievements/achievement_unlocked7.png"
			}];
			userData.markModified("achievements.invite");
			await userData.save();
		}

		const thanksEmbed = new EmbedBuilder()
			.setAuthor({
				name: "Спасибо что добавили меня на свой сервер!"
			})
			.setDescription("Чтобы получить список команд, используйте `/help`!.")
			.setColor(client.config.embed.color)
			.setFooter({
				text: client.config.embed.footer
			})
			.setTimestamp();
		messageOptions.embeds = [thanksEmbed];

		const owner = await guild.fetchOwner();
		owner.send(messageOptions);

		const users = guild.members.cache.filter(m => !m.user.bot).size;
		const bots = guild.members.cache.filter(m => m.user.bot).size;

		const embed = new EmbedBuilder()
			.setAuthor({
				name: guild.name,
				iconURL: guild.iconURL()
			})
			.setColor("#32CD32")
			.setDescription(`Зашёл на сервер **${guild.name}**. На нём **${users}** ${client.getNoun(users, client.translate("misc:NOUNS:USERS:1"), client.translate("misc:NOUNS:USERS:2"), client.translate("misc:NOUNS:USERS:5"))} и **${bots}** ${client.getNoun(bots, client.translate("misc:NOUNS:BOTS:1"), client.translate("misc:NOUNS:BOTS:2"), client.translate("misc:NOUNS:BOTS:5"))}`);
		client.channels.cache.get(client.config.support.logs).send({
			embeds: [embed]
		});
	}
}

module.exports = GuildCreate;