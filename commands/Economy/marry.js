const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const BaseCommand = require("../../base/BaseCommand"),
	pendings = {};

class Marry extends BaseCommand {
	/**
	 *
	 * @param {import("../base/JaBa")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("marry")
				.setDescription(client.translate("economy/marry:DESCRIPTION"))
				.setDescriptionLocalizations({
					"uk": client.translate("economy/marry:DESCRIPTION", null, "uk-UA"),
					"ru": client.translate("economy/marry:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(false)
				.addUserOption(option => option.setName("user")
					.setDescription(client.translate("common:USER"))
					.setDescriptionLocalizations({
						"uk": client.translate("common:USER", null, "uk-UA"),
						"ru": client.translate("common:USER", null, "ru-RU"),
					})
					.setRequired(true)),
			aliases: [],
			dirname: __dirname,
			ownerOnly: false,
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
	 * @param {Object} data
	 */
	async execute(client, interaction, data) {
		if (data.userData.lover) return interaction.error("economy/marry:ALREADY_MARRIED");

		const member = interaction.options.getMember("user");
		if (member.user.bot) return interaction.error("economy/marry:BOT_USER");
		if (member.id === interaction.member.id) return interaction.error("economy/marry:YOURSELF");

		const userData = await client.findOrCreateUser({
			id: member.id,
		});
		if (userData.lover) return interaction.error("economy/marry:ALREADY_MARRIED_USER", { user: member.toString() });

		for (const requester in pendings) {
			const receiver = pendings[requester];

			if (requester === interaction.author.id) {
				const user = client.users.cache.get(receiver) || await client.users.fetch(receiver);
				return interaction.error("economy/marry:REQUEST_AUTHOR_TO_AMEMBER", {
					user: user.toString,
				});
			} else if (receiver === interaction.member.id) {
				const user = client.users.cache.get(requester) || await client.users.fetch(requester);
				return interaction.error("economy/marry:REQUEST_AMEMBER_TO_AUTHOR", {
					user: user.toString(),
				});
			} else if (requester === member.id) {
				const user = client.users.cache.get(receiver) || await client.users.fetch(receiver);
				return interaction.error("economy/marry:REQUEST_AMEMBER_TO_MEMBER", {
					firstUser: member.toString(),
					secondUser: user.toString(),
				});
			} else if (receiver === member.id) {
				const user = client.users.cache.get(requester) || await client.users.fetch(requester);
				return interaction.error("economy/marry:REQUEST_MEMBER_TO_AMEMBER", {
					firstUser: member.toString(),
					secondUser: user.toString(),
				});
			}
		}

		pendings[interaction.member.id] = member.id;

		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId("marry_confirm_yes")
					.setLabel(interaction.translate("common:ACCEPT"))
					.setStyle(ButtonStyle.Success),
				new ButtonBuilder()
					.setCustomId("marry_confirm_no")
					.setLabel(interaction.translate("common:CANCEL"))
					.setStyle(ButtonStyle.Danger),
			);

		await interaction.reply({
			content: interaction.translate("economy/marry:REQUEST", {
				to: member.toString(),
				from: interaction.member.toString(),
			}),
			components: [row],
		});

		const filter = i => i.user.id === member.id;
		const collector = interaction.channel.createMessageComponentCollector({ filter, idle: (10 * 60 * 1000) });

		collector.on("collect", async i => {
			if (i.isButton()) {
				if (i.customId === "marry_confirm_yes") return collector.stop(true);
				else if (i.customId === "marry_confirm_no") return collector.stop(false);
			}
		});

		collector.on("end", async (_, reason) => {
			delete pendings[interaction.member.id];
			if (reason === "time") {
				row.components.forEach(component => {
					component.setDisabled(true);
				});

				return interaction.editReply({
					components: [row],
				});
			}

			if (reason) {
				data.userData.lover = member.id;
				await data.userData.save();
				userData.lover = interaction.member.id;
				await userData.save();

				const messageOptions = {
					content: `${member.toString()} :heart: ${interaction.member.toString()}`,
					files: [{
						name: "achievement_unlocked3.png",
						attachment: "./assets/img/achievements/achievement_unlocked3.png",
					}],
				};

				let sent = false;
				if (!userData.achievements.married.achieved) {
					interaction.followUp(messageOptions);
					sent = true;
					userData.achievements.married.achieved = true;
					userData.achievements.married.progress.now = 1;
					userData.markModified("achievements.married");
					await userData.save();
				}

				if (!data.userData.achievements.married.achieved) {
					if (!sent) interaction.followUp(messageOptions);
					data.userData.achievements.married.achieved = true;
					data.userData.achievements.married.progress.now = 1;
					data.userData.markModified("achievements.married");
					await data.userData.save();
				}

				return interaction.editReply({
					content: interaction.translate("economy/marry:SUCCESS", {
						creator: interaction.member.toString(),
						partner: member.toString(),
					}),
					components: [],
				});
			} else {
				return interaction.editReply({
					content: interaction.translate("economy/marry:DENIED", {
						creator: interaction.member.toString(),
						partner: member.toString(),
					}),
					components: [],
				});
			}
		});
	}
}

module.exports = Marry;