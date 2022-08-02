const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand");

class Servers extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("servers")
				.setDescription(client.translate("owner/servers:DESCRIPTION")),
			aliases: [],
			dirname: __dirname,
			guildOnly: true,
			ownerOnly: true
		});
	}
	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 */
	async onLoad() {
		//...
	}
	/**
	 *
	 * @param {import("../../base/JaBa")} client
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 * @param {Array} data
	 */
	async execute(client, interaction) {
		let i0 = 0,
			i1 = 10,
			page = 1;

		let description = `${interaction.translate("common:SERVERS")}: ${client.guilds.cache.size}\n\n` +
			client.guilds.cache
				.sort((a, b) => b.memberCount - a.memberCount)
				.map((r) => r)
				.map((r, i) => `**${i + 1}** - ${r.name} | ${r.memberCount} ${client.getNoun(r.memberCount, interaction.translate("misc:NOUNS:MEMBERS:1"), interaction.translate("misc:NOUNS:MEMBERS:2"), interaction.translate("misc:NOUNS:MEMBERS:5"))}`)
				.slice(0, 10)
				.join("\n");

		const embed = new EmbedBuilder()
			.setAuthor({
				name: interaction.user.tag,
				iconURL: interaction.member.displayAvatarURL({
					extension: "png",
					size: 512
				})
			})
			.setColor(client.config.embed.color)
			.setFooter({
				text: client.user.username
			})
			.setTitle(`${interaction.translate("common:PAGE")}: ${page}/${client.guilds.cache.size}`)
			.setDescription(description);

		await interaction.reply({
			embeds: [embed],
		});

		const msg = await interaction.fetchReply();

		await msg.react("⬅");
		await msg.react("➡");
		await msg.react("❌");

		const collector = msg.createReactionCollector({
			time: 60 * 1000
		});

		collector.on("collect", async reaction => {
			if (reaction._emoji.name === "⬅") {
				i0 = i0 - 10;
				i1 = i1 - 10;
				page = page - 1;

				if (i0 < 0) return msg.delete();
				if (!i0 || !i1) return msg.delete();

				description = `${interaction.translate("common:SERVERS")}: ${client.guilds.cache.size}\n\n` +
					client.guilds.cache
						.sort((a, b) => b.memberCount - a.memberCount)
						.map((r) => r)
						.map((r, i) => `**${i + 1}** - ${r.name} | ${r.memberCount} ${client.getNoun(r.memberCount, interaction.translate("misc:NOUNS:MEMBERS:1"), interaction.translate("misc:NOUNS:MEMBERS:2"), interaction.translate("misc:NOUNS:MEMBERS:5"))}`)
						.slice(i0, i1)
						.join("\n");

				embed
					.setTitle(`${interaction.translate("common:PAGE")}: ${page}/${client.guilds.cache.size}`)
					.setDescription(description);

				msg.edit({
					embeds: [embed]
				});
			}

			if (reaction._emoji.name === "➡") {
				i0 = i0 + 10;
				i1 = i1 + 10;
				page = page + 1;

				if (i1 > client.guilds.cache.size + 10) return msg.delete();
				if (!i0 || !i1) return msg.delete();

				description = `${interaction.translate("common:SERVERS")}: ${client.guilds.cache.size}\n\n` +
					client.guilds.cache
						.sort((a, b) => b.memberCount - a.memberCount)
						.map((r) => r)
						.map((r, i) => `**${i + 1}** - ${r.name} | ${r.memberCount} ${client.getNoun(r.memberCount, interaction.translate("misc:NOUNS:MEMBERS:1"), interaction.translate("misc:NOUNS:MEMBERS:2"), interaction.translate("misc:NOUNS:MEMBERS:5"))}`)
						.slice(i0, i1)
						.join("\n");

				embed.setTitle(`${interaction.translate("common:PAGE")}: ${page}/${Math.round(client.guilds.cache.size / 10)}`)
					.setDescription(description);

				msg.edit({
					embeds: [embed]
				});
			}

			if (reaction._emoji.name === "❌") return msg.delete();

			await reaction.users.remove(interaction.member.id);
		});
	}
}

module.exports = Servers;