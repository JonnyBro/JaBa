const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require("discord.js"),
	{ QueueRepeatMode } = require("discord-player");
const BaseCommand = require("../../base/BaseCommand");

class Nowplaying extends BaseCommand {
	/**
	 *
	 * @param {import("../base/Client")} client
	 */
	constructor(client) {
		super({
			command: new SlashCommandBuilder()
				.setName("nowplaying")
				.setDescription(client.translate("music/nowplaying:DESCRIPTION"))
				.setDescriptionLocalizations({
					uk: client.translate("music/nowplaying:DESCRIPTION", null, "uk-UA"),
					ru: client.translate("music/nowplaying:DESCRIPTION", null, "ru-RU"),
				})
				.setDMPermission(false),
			dirname: __dirname,
			ownerOnly: false,
		});
	}

	/**
	 *
	 * @param {import("../../base/Client")} client
	 */
	async onLoad(client) {
		client.on("interactionCreate", async interaction => {
			if (!interaction.isButton()) return;

			if (interaction.customId.startsWith("nowp_")) {
				interaction.data = [];
				interaction.data.guild = await client.findOrCreateGuild(interaction.guildId);

				const voice = interaction.member.voice.channel;
				if (!voice) return interaction.error("music/play:NO_VOICE_CHANNEL");

				const queue = client.player.nodes.get(interaction.guildId);
				if (!queue) return interaction.error("music/play:NOT_PLAYING");

				const row1 = new ActionRowBuilder().addComponents(
					new ButtonBuilder().setCustomId("nowp_prev_track").setStyle(ButtonStyle.Primary).setEmoji("⬅️"),
					new ButtonBuilder().setCustomId("nowp_stop").setStyle(ButtonStyle.Danger).setEmoji("⏹️"),
					new ButtonBuilder().setCustomId("nowp_add_track").setStyle(ButtonStyle.Success).setEmoji("▶️"),
					new ButtonBuilder().setCustomId("nowp_next_track").setStyle(ButtonStyle.Primary).setEmoji("➡️"),
					new ButtonBuilder().setCustomId("nowp_loop").setStyle(ButtonStyle.Secondary).setEmoji("🔁"),
				);

				const row2 = new ActionRowBuilder().addComponents(
					new ButtonBuilder().setCustomId("nowp_queue").setStyle(ButtonStyle.Secondary).setEmoji("ℹ️"),
				);

				if (interaction.customId === "nowp_prev_track") {
					await interaction.deferUpdate();

					if (queue.history.isEmpty()) return interaction.followUp({ content: interaction.translate("music/back:NO_PREV_SONG", null, "error"), ephemeral: true });

					queue.history.back();

					await interaction.followUp({ content: interaction.translate("music/back:SUCCESS"), ephemeral: true });

					const embed = await updateEmbed(interaction, queue);

					interaction.editReply({
						embeds: [embed],
					});
				} else if (interaction.customId === "nowp_loop") {
					await interaction.deferUpdate();

					const selectMenu = new StringSelectMenuBuilder()
						.setCustomId("nowp_select")
						.setPlaceholder(interaction.translate("common:NOTHING_SELECTED"))
						.addOptions(
							new StringSelectMenuOptionBuilder()
								.setLabel(interaction.translate("music/loop:AUTOPLAY"))
								.setValue("3"),
							new StringSelectMenuOptionBuilder()
								.setLabel(interaction.translate("music/loop:QUEUE"))
								.setValue("2"),
							new StringSelectMenuOptionBuilder()
								.setLabel(interaction.translate("music/loop:TRACK"))
								.setValue("1"),
							new StringSelectMenuOptionBuilder()
								.setLabel(interaction.translate("music/loop:DISABLE"))
								.setValue("0"),
						);

					const selectRow = new ActionRowBuilder().addComponents(selectMenu),
						msg = await interaction.followUp({
							components: [selectRow],
							ephemeral: true,
						});

					const filter = i => i.user.id === interaction.user.id,
						collected = await msg.awaitMessageComponent({ filter, time: 10 * 1000 }),
						mode = collected.values[0] === "3" ? QueueRepeatMode.AUTOPLAY : collected.values[0] === "2" ? QueueRepeatMode.QUEUE : collected.values[0] === "1" ? QueueRepeatMode.TRACK : QueueRepeatMode.OFF,
						translated = {
							"3": interaction.translate("music/loop:AUTOPLAY_ENABLED"),
							"2": interaction.translate("music/loop:QUEUE_ENABLED"),
							"1": interaction.translate("music/loop:TRACK_ENABLED"),
							"0": interaction.translate("music/loop:LOOP_DISABLED"),
						};

					await collected.deferUpdate();

					queue.setRepeatMode(mode);

					await interaction.followUp({ content: translated[collected.values[0]] });

					const embed = await updateEmbed(interaction, queue);

					interaction.editReply({
						embeds: [embed],
					});
				} else if (interaction.customId === "nowp_add_track") {
					await interaction.deferUpdate();

					await interaction.followUp({
						content: interaction.translate("music/nowplaying:LINK"),
						ephemeral: true,
					});

					const filter = m => m.author.id === interaction.user.id && m.content.startsWith("http"),
						collect = await interaction.channel.awaitMessages({ filter, time: 10 * 1000, max: 1 });
					if (collect.size < 1) return;


					const collected = collect.first(),
						query = collected.content.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/g)[0],
						searchResult = await client.player.search(query, {
							requestedBy: interaction.user,
						});

					if (collected.deletable) collected.delete();

					if (!searchResult.hasTracks()) return interaction.error("music/play:NO_RESULT", { query: query }, { edit: true });
					else queue.addTrack(searchResult);

					await interaction.followUp({
						content: interaction.translate("music/play:ADDED_QUEUE", {
							songName: searchResult.hasPlaylist() ? searchResult.playlist.title : searchResult.tracks[0].title,
						}),
					});

					const embed = await updateEmbed(interaction, queue);

					interaction.editReply({
						embeds: [embed],
					});
				} else if (interaction.customId === "nowp_next_track") {
					await interaction.deferUpdate();

					queue.node.skip();

					await interaction.followUp({ content: interaction.translate("music/skip:SUCCESS"), ephemeral: true });

					const embed = await updateEmbed(interaction, queue);

					interaction.editReply({
						embeds: [embed],
					});
				} else if (interaction.customId === "nowp_queue") {
					await interaction.deferUpdate();

					client.commands.get("queue").execute(client, interaction);
				} else if (interaction.customId === "nowp_stop") {
					await interaction.deferUpdate();

					queue.delete();
					await interaction.followUp({ content: interaction.translate("music/stop:SUCCESS") });

					row1.components.forEach(component => {
						component.setDisabled(true);
					});

					row2.components.forEach(component => {
						component.setDisabled(true);
					});

					return interaction.editReply({
						components: [row1, row2],
					});
				}
			}
		});
	}

	/**
	 *
	 * @param {import("../../base/Client")} client
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 * @param {Object} data
	 */
	async execute(client, interaction) {
		await interaction.deferReply();

		const queue = client.player.nodes.get(interaction.guildId);
		if (!queue) return interaction.error("music/play:NOT_PLAYING", null, { edit: true });

		const row1 = new ActionRowBuilder().addComponents(
			new ButtonBuilder().setCustomId("nowp_prev_track").setStyle(ButtonStyle.Primary).setEmoji("⬅️"),
			new ButtonBuilder().setCustomId("nowp_stop").setStyle(ButtonStyle.Danger).setEmoji("⏹️"),
			new ButtonBuilder().setCustomId("nowp_add_track").setStyle(ButtonStyle.Success).setEmoji("▶️"),
			new ButtonBuilder().setCustomId("nowp_next_track").setStyle(ButtonStyle.Primary).setEmoji("➡️"),
			new ButtonBuilder().setCustomId("nowp_loop").setStyle(ButtonStyle.Secondary).setEmoji("🔁"),
		);

		const row2 = new ActionRowBuilder().addComponents(
			new ButtonBuilder().setCustomId("nowp_queue").setStyle(ButtonStyle.Secondary).setEmoji("ℹ️"),
		);

		const embed = await updateEmbed(interaction, queue);

		const message = await interaction.editReply({
			embeds: [embed],
			components: [row1, row2],
		});

		const i = setInterval(async function () {
			if (message && message.editable && queue.isPlaying()) {
				const e = await updateEmbed(interaction, queue);

				message.edit({
					embeds: [e],
					components: [row1, row2],
				});
			} else clearInterval(i);
		}, 60 * 1000);
	}
}

/**
 *
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 * @param {import("discord-player").GuildQueue} queue
 * @returns
 */
async function updateEmbed(interaction, queue) {
	const progressBar = queue.node.createProgressBar(),
		track = queue.currentTrack,
		mode = queue.repeatMode === QueueRepeatMode.AUTOPLAY ? "3" : queue.repeatMode === QueueRepeatMode.QUEUE ? "2" : queue.repeatMode === QueueRepeatMode.TRACK ? "1" : "0",
		translated = {
			"3": interaction.translate("music/loop:AUTOPLAY"),
			"2": interaction.translate("music/loop:QUEUE"),
			"1": interaction.translate("music/loop:TRACK"),
			"0": interaction.translate("common:DISABLED"),
		};

	const embed = interaction.client.embed({
		author: interaction.translate("music/nowplaying:CURRENTLY_PLAYING"),
		thumbnail: track.thumbnail || null,
		fields: [
			{
				name: interaction.translate("music/nowplaying:T_TITLE"),
				value: `[${track.title}](${track.url})`,
				inline: true,
			},
			{
				name: interaction.translate("music/nowplaying:T_AUTHOR"),
				value: track.author || interaction.translate("common:UNKNOWN"),
				inline: true,
			},
			{ name: "\u200B", value: "\u200B", inline: true },
			{
				name: interaction.translate("common:VIEWS"),
				value: track.raw.live ? "Live" : new Intl.NumberFormat(interaction.client.defaultLanguage.moment, { notation: "standard" }).format(track.raw.views),
				inline: true,
			},
			{
				name: interaction.translate("music/queue:ADDED"),
				value: track.requestedBy.toString(),
				inline: true,
			},
			{
				name: interaction.translate("music/nowplaying:T_DURATION"),
				value: progressBar,
			},
			{
				name: "\u200b",
				value: `${interaction.translate("music/nowplaying:REPEAT")}: \`${translated[mode]}\``,
			},
		],
	});

	return embed;
}

module.exports = Nowplaying;
