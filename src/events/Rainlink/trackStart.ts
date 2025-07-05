import { convertTime, formatString, translateContext } from "@/helpers/functions.js";
import logger from "@/helpers/logger.js";
import { RainlinkPlayerCustom } from "@/types.js";
import { createEmbed } from "@/utils/create-embed.js";
import useClient from "@/utils/use-client.js";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	GuildMember,
	MessageFlags,
	User,
} from "discord.js";
import { RainlinkLoopMode, RainlinkTrack } from "rainlink";

const client = useClient();
const debug = !client.configService.get<boolean>("production");

enum ButtonId {
	PLAY_PAUSE_BUTTON_ID = "trackStart_play_pause",
	VOLUMEUP_BUTTON_ID = "trackStart_volume_up",
	VOLUMEDOWN_BUTTON_ID = "trackStart_volume_down",
	LOOP_BUTTON_ID = "trackStart_loop",
	SHUFFLE_BUTTON_ID = "trackStart_shuffle",
	PREV_BUTTON_ID = "trackStart_previous",
	SKIP_BUTTON_ID = "trackStart_skip",
	STOP_BUTTON_ID = "trackStart_stop",
}

export const data = {
	name: "trackStart",
	player: true,
};

export async function run(player: RainlinkPlayerCustom, track: RainlinkTrack) {
	if (!player) return;
	if (!track) return;

	const guild = client.guilds.cache.get(player.guildId);
	if (!guild) return;

	const guildData = await client.getGuildData(player.guildId);

	const trackTitle = formatString(track?.title || "Unknown", 30).replace(/ - Topic$/, "");
	const trackAuthor = formatString(track?.author || "Unknown", 25).replace(/ - Topic$/, "");
	const trackDuration = track.isStream ? ":red_circle:" : convertTime(track.duration);
	const trackRequester = track.requester as User;

	if (debug) {
		logger.debug(
			`Track started in ${guild.name} (${guild.id})\nTrack: ${trackTitle}\nURL: ${track.uri}`,
		);
	}

	const trackEmbed = createEmbed({
		author: {
			name: player.paused
				? await translateContext(guild, "music/queue:PAUSED")
				: await translateContext(guild, "music/queue:PLAYING"),
			iconURL: client.user.displayAvatarURL(),
		},
		description: `**[${trackTitle} - ${trackAuthor}](${track.uri})**`,
		fields: [
			{
				name: await translateContext(guild, "music/queue:SOURCE"),
				value: `${capitalize(track.source)}`,
				inline: true,
			},
			{
				name: await translateContext(guild, "music/queue:DURATION"),
				value: `\`${trackDuration}\``,
				inline: true,
			},
			{
				name: await translateContext(guild, "music/queue:ADDED"),
				value: trackRequester.toString(),
				inline: true,
			},
		],
	}).setThumbnail(track.artworkUrl);

	const nextTrackTitle = formatString(player?.queue[0]?.title || "Unknown", 30).replace(/ - Topic$/, "");
	const nextTrackAuthor = formatString(player?.queue[0]?.author || "Unknown", 25).replace(/ - Topic$/, "");
	const nextTrackLink = player?.queue[0]?.uri;

	if (nextTrackLink) {
		trackEmbed.addFields({
			name: await translateContext(guild, "music/queue:NEXT"),
			value: `**[${nextTrackTitle} - ${nextTrackAuthor}](${nextTrackLink})**`,
		});
	}

	const buttons1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setCustomId(ButtonId.PLAY_PAUSE_BUTTON_ID)
			.setEmoji(player.paused ? "▶️" : "⏸️")
			.setStyle(player.paused ? ButtonStyle.Primary : ButtonStyle.Secondary),
		new ButtonBuilder()
			.setCustomId(ButtonId.VOLUMEUP_BUTTON_ID)
			.setEmoji("⬆️")
			.setStyle(ButtonStyle.Secondary),
		new ButtonBuilder()
			.setCustomId(ButtonId.VOLUMEDOWN_BUTTON_ID)
			.setEmoji("⬇️")
			.setStyle(ButtonStyle.Secondary),
		new ButtonBuilder()
			.setCustomId(ButtonId.LOOP_BUTTON_ID)
			.setEmoji("🔃")
			.setStyle(ButtonStyle.Secondary),
	);

	const buttons2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setCustomId(ButtonId.SHUFFLE_BUTTON_ID)
			.setEmoji("🔀")
			.setStyle(ButtonStyle.Secondary),
		new ButtonBuilder()
			.setCustomId(ButtonId.PREV_BUTTON_ID)
			.setEmoji("⏮️")
			.setStyle(ButtonStyle.Secondary),
		new ButtonBuilder()
			.setCustomId(ButtonId.SKIP_BUTTON_ID)
			.setEmoji("⏭️")
			.setStyle(ButtonStyle.Secondary),
		new ButtonBuilder()
			.setCustomId(ButtonId.STOP_BUTTON_ID)
			.setEmoji("❌")
			.setStyle(ButtonStyle.Danger),
	);

	const channel = client.channels.cache.get(player.textId);
	if (!channel || !channel.isSendable()) return;

	const nplaying = await channel.send({ embeds: [trackEmbed], components: [buttons1, buttons2] });
	player.message = nplaying;

	const embed = createEmbed();
	const collector = nplaying.createMessageComponentCollector();

	collector.on("collect", async (interaction: ButtonInteraction) => {
		if (!player) return collector.stop();

		const member = interaction.member as GuildMember;

		if (!member.voice.channel || player.voiceId !== member.voice.channelId) {
			embed.setDescription(await translateContext(guild, "music/play:NOT_SAME_CHANNEL"));

			return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
		}

		switch (interaction.customId) {
			case ButtonId.PLAY_PAUSE_BUTTON_ID:
				if (!player.paused) {
					await interaction.deferUpdate();

					player.pause();

					buttons1.components[0].setEmoji("▶️").setStyle(ButtonStyle.Primary);

					trackEmbed.setAuthor({
						name: await translateContext(guild, "music/queue:PAUSED"),
						iconURL: client.user.displayAvatarURL(),
					});
				} else {
					await interaction.deferUpdate();

					player.resume();

					buttons1.components[0].setEmoji("⏸️").setStyle(ButtonStyle.Secondary);

					trackEmbed.setAuthor({
						name: await translateContext(guild, "music/queue:PLAYING"),
						iconURL: client.user.displayAvatarURL(),
					});
				}

				await nplaying.edit({ embeds: [trackEmbed], components: [buttons1, buttons2] });

				break;
			case ButtonId.PREV_BUTTON_ID:
				if (!player.queue.previous.length) {
					embed.setDescription(await translateContext(guild, "music/back:NO_PREV_SONG"));

					return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
				}

				await interaction.deferUpdate();

				player.previous();

				break;
			case ButtonId.SKIP_BUTTON_ID:
				if (player.queue.isEmpty && !guildData.plugins.music.autoPlay) {
					embed.setDescription(await translateContext(guild, "music/queue:NO_QUEUE"));

					return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
				}

				await interaction.deferUpdate();

				player.skip();

				break;
			case ButtonId.LOOP_BUTTON_ID:
				switch (player.loop) {
					case "none":
						player.setLoop(RainlinkLoopMode.SONG);
						break;
					case "song":
						player.setLoop(RainlinkLoopMode.QUEUE);
						break;
					case "queue":
						player.setLoop(RainlinkLoopMode.NONE);
						break;
				}

				embed.setDescription(
					await translateContext(
						guild,
						`music/loop:SUCCESS_${player.loop.toUpperCase()}`,
					),
				);

				return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
			case ButtonId.SHUFFLE_BUTTON_ID:
				if (player.queue.isEmpty) {
					embed.setDescription(await translateContext(guild, "music/queue:NO_QUEUE"));

					return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
				}

				player.queue.shuffle();

				embed.setDescription(await translateContext(guild, "music/shuffle:SUCCESS"));

				return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
			case ButtonId.VOLUMEUP_BUTTON_ID:
				if (player.volume >= 100) {
					embed.setDescription(await translateContext(guild, "music/volume:TOO_MUCH"));

					return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
				}

				player.setVolume(player.volume + 10);

				embed.setDescription(
					await translateContext(guild, "music/volume:SUCCESS", {
						volume: player.volume + 10,
					}),
				);

				return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
			case ButtonId.VOLUMEDOWN_BUTTON_ID:
				if (player.volume <= 0) {
					embed.setDescription(await translateContext(guild, "music/volume:TOO_LOW"));

					return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
				}

				player.setVolume(player.volume - 10);

				embed.setDescription(
					await translateContext(guild, "music/volume:SUCCESS", {
						volume: player.volume - 10,
					}),
				);

				return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
			case ButtonId.STOP_BUTTON_ID:
				await interaction.deferUpdate();

				player.stop(true);

				break;
		}
	});
}

function capitalize(str: string) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}
