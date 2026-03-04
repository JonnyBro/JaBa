import { capitalizeString, convertTime, shortenString, translateContext } from "@/helpers/functions.js";
import logger from "@/helpers/logger.js";
import { doAutoplay } from "@/helpers/music.js";
import { PlayerCustom } from "@/types.js";
import { createEmbed } from "@/utils/create-embed.js";
import useClient from "@/utils/use-client.js";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	EmbedBuilder,
	GuildMember,
	MessageFlags,
} from "discord.js";
import { RepeatMode, Track } from "lavalink-client";

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

const MAX_VOLUME = 100;
const MIN_VOLUME = 0;

export const data = {
	name: "trackStart",
	player: true,
	once: false,
};

export async function run(player: PlayerCustom, track: Track | null) {
	if (!player || !track) return;

	const guild = client.guilds.cache.get(player.guildId);
	if (!guild) return;

	try {
		if (debug)
			logger.debug(
				`Track started in ${guild.name} (${guild.id})
				Track: ${track.info.title || "Unknown"}
				URL: ${track.info.uri}`,
			);

		const trackEmbed = await createTrackEmbed(player, track, player.guildId);
		const buttons = buildControlButtons(player);

		const channel = client.channels.cache.get(player.textChannelId!);
		if (!channel || !channel.isSendable()) return;

		player.message = await channel.send({
			embeds: [trackEmbed],
			components: buttons,
		});

		const collector = player.message.createMessageComponentCollector({
			time: track.info.duration + 1_000, // track duration + 1 minute
		});

		collector.on("collect", async (interaction: ButtonInteraction) => {
			if (!player) return collector.stop();

			try {
				const member = interaction.member as GuildMember;
				if (!member.voice.channel || player.voiceChannelId !== member.voice.channelId) {
					const embed = createEmbed({
						description: await translateContext(guild, "music/play:NOT_SAME_CHANNEL"),
					});

					await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

					return;
				}

				switch (interaction.customId) {
					case ButtonId.PLAY_PAUSE_BUTTON_ID:
						await interaction.deferUpdate();

						await handlePlayPause(interaction, player, trackEmbed, buttons);

						break;

					case ButtonId.VOLUMEUP_BUTTON_ID:
						await interaction.deferUpdate();

						await handleVolumeChange(interaction, player, 10);

						break;

					case ButtonId.VOLUMEDOWN_BUTTON_ID:
						await interaction.deferUpdate();

						await handleVolumeChange(interaction, player, -10);

						break;

					case ButtonId.LOOP_BUTTON_ID:
						await interaction.deferUpdate();

						await handleLoop(interaction, player);

						break;

					case ButtonId.SHUFFLE_BUTTON_ID: {
						await interaction.deferUpdate();

						const embed = createEmbed();

						if (!player.queue.tracks.length) {
							embed.setDescription(await translateContext(guild, "music/queue:NO_QUEUE"));

							await interaction.reply({
								embeds: [embed],
								flags: MessageFlags.Ephemeral,
							});

							return;
						}

						player.queue.shuffle();

						embed.setDescription(await translateContext(guild, "music/shuffle:SUCCESS"));

						await interaction.followUp({
							embeds: [embed],
							flags: MessageFlags.Ephemeral,
						});

						break;
					}

					case ButtonId.PREV_BUTTON_ID: {
						await interaction.deferUpdate();

						const embed = createEmbed();

						if (!player.queue.previous.length) {
							embed.setDescription(await translateContext(guild, "music/back:NO_PREV_SONG"));

							await interaction.followUp({
								embeds: [embed],
								flags: MessageFlags.Ephemeral,
							});

							return;
						}

						await player.play({
							track: player.queue.previous[0],
						});

						embed.setDescription(await translateContext(guild, "music/back:SUCCESS"));

						await interaction.followUp({
							embeds: [embed],
							flags: MessageFlags.Ephemeral,
						});

						break;
					}

					case ButtonId.SKIP_BUTTON_ID: {
						await interaction.deferUpdate();

						const guildData = await client.getGuildData(player.guildId);

						if (!guildData.plugins.music.autoPlay && !player.queue.tracks.length) {
							const embed = createEmbed({
								description: await translateContext(guild, "music/queue:NO_QUEUE"),
							});

							await interaction.followUp({
								embeds: [embed],
								flags: MessageFlags.Ephemeral,
							});

							return;
						}

						if (guildData.plugins.music.autoPlay) {
							await doAutoplay(player);
							return await player.skip();
						}

						await player.skip();

						break;
					}

					case ButtonId.STOP_BUTTON_ID:
						await interaction.deferUpdate();

						await player.destroy("stopped by user", true);

						collector.stop();

						break;
				}
			} catch (e) {
				logger.error("[trackStart] Error handling button interaction:", e);

				if (interaction.channel?.isSendable())
					await interaction.channel.send({
						content: "unfunny error happened, let admin know",
					});
			}
		});

		collector.on("end", () => {
			if (player.message?.deletable) player.message.delete().catch(() => {});
		});
	} catch (e) {
		logger.error("[trackStart] Event error:", e);
	}
}

const createTrackEmbed = async (player: PlayerCustom, track: Track, guildId: string): Promise<EmbedBuilder> => {
	const guild = client.guilds.cache.get(guildId);
	if (!guild) throw logger.error("[trackStart] Guild not found");

	const trackTitle = shortenString(track.info.title || "Unknown", 30).replace(/ - Topic$/, "");
	const trackAuthor = shortenString(track.info.author || "Unknown", 25).replace(/ - Topic$/, "");
	const trackDuration = track.info.isStream ? ":red_circle:" : `\`${convertTime(track.info.duration)}\``;
	const trackRequester = track.requester;

	const embed = createEmbed({
		author: {
			name: player.paused
				? await translateContext(guild, "music/queue:PAUSED")
				: await translateContext(guild, "music/queue:PLAYING"),
			iconURL: client.user.displayAvatarURL(),
		},
		description: /^https?:\/\//.test(track.info.uri)
			? `**[${trackTitle} - ${trackAuthor}](${track.info.uri})**`
			: `**${trackTitle} - ${trackAuthor}**`,
		fields: [
			{
				name: await translateContext(guild, "music/queue:SOURCE"),
				value: `${capitalizeString(track.info.sourceName)}`,
				inline: true,
			},
			{
				name: await translateContext(guild, "music/queue:DURATION"),
				value: trackDuration,
				inline: true,
			},
			{
				name: await translateContext(guild, "music/queue:ADDED"),
				value: trackRequester?.toString() || "Unknown",
				inline: true,
			},
		],
	}).setThumbnail(track.info.artworkUrl || null);

	const nextTrack = player.queue.tracks[0];
	if (nextTrack) {
		const nextTrackTitle = shortenString(nextTrack.info.title || "Unknown", 30).replace(/ - Topic$/, "");
		const nextTrackAuthor = shortenString(nextTrack.info.author || "Unknown", 25).replace(/ - Topic$/, "");

		embed.addFields({
			name: await translateContext(guild, "music/queue:NEXT"),
			value: /^https?:\/\//.test(nextTrack.info.uri!)
				? `**[${nextTrackTitle} - ${nextTrackAuthor}](${nextTrack?.info?.uri})**`
				: `**${nextTrackTitle} - ${nextTrackAuthor}**`,
		});
	}

	return embed;
};

const buildControlButtons = (
	player: PlayerCustom,
): [ActionRowBuilder<ButtonBuilder>, ActionRowBuilder<ButtonBuilder>] => {
	const repeat = player.repeatMode;
	const loopEmoji = repeat === "off" ? "🔃" : repeat === "track" ? "🔂" : "🔁";
	const loopStyle = repeat === "off" ? ButtonStyle.Secondary : ButtonStyle.Primary;

	const buttons1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setCustomId(ButtonId.PLAY_PAUSE_BUTTON_ID)
			.setEmoji(player.paused ? "▶️" : "⏸️")
			.setStyle(player.paused ? ButtonStyle.Primary : ButtonStyle.Secondary),
		new ButtonBuilder().setCustomId(ButtonId.VOLUMEDOWN_BUTTON_ID).setEmoji("➖").setStyle(ButtonStyle.Secondary),
		new ButtonBuilder().setCustomId(ButtonId.VOLUMEUP_BUTTON_ID).setEmoji("➕").setStyle(ButtonStyle.Secondary),
		new ButtonBuilder().setCustomId(ButtonId.LOOP_BUTTON_ID).setEmoji(loopEmoji).setStyle(loopStyle),
	);

	const buttons2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder().setCustomId(ButtonId.SHUFFLE_BUTTON_ID).setEmoji("🔀").setStyle(ButtonStyle.Secondary),
		new ButtonBuilder().setCustomId(ButtonId.PREV_BUTTON_ID).setEmoji("⏮️").setStyle(ButtonStyle.Secondary),
		new ButtonBuilder().setCustomId(ButtonId.SKIP_BUTTON_ID).setEmoji("⏭️").setStyle(ButtonStyle.Secondary),
		new ButtonBuilder().setCustomId(ButtonId.STOP_BUTTON_ID).setEmoji("❌").setStyle(ButtonStyle.Danger),
	);

	return [buttons1, buttons2];
};

const updatePlayerMessage = async (
	player: PlayerCustom,
	trackEmbed: EmbedBuilder,
	components: Array<ActionRowBuilder<ButtonBuilder>>,
): Promise<void> => {
	if (!player.message) return;

	try {
		await player.message.edit({
			embeds: [trackEmbed],
			components,
		});
	} catch (error) {
		logger.error("Failed to update player message:", error);
	}
};

const handlePlayPause = async (
	interaction: ButtonInteraction,
	player: PlayerCustom,
	trackEmbed: EmbedBuilder,
	components: Array<ActionRowBuilder<ButtonBuilder>>,
): Promise<void> => {
	if (player.paused) {
		await player.resume();

		components[0].components[0].setEmoji("⏸️").setStyle(ButtonStyle.Secondary);

		trackEmbed.setAuthor({
			name: await translateContext(interaction.guild!, "music/queue:PLAYING"),
			iconURL: client.user.displayAvatarURL(),
		});
	} else {
		await player.pause();

		components[0].components[0].setEmoji("▶️").setStyle(ButtonStyle.Primary);

		trackEmbed.setAuthor({
			name: await translateContext(interaction.guild!, "music/queue:PAUSED"),
			iconURL: client.user.displayAvatarURL(),
		});
	}

	await updatePlayerMessage(player, trackEmbed, components);
};

const handleVolumeChange = async (
	interaction: ButtonInteraction,
	player: PlayerCustom,
	amount: number,
): Promise<void> => {
	const embed = createEmbed();
	const newVolume = player.volume + amount;

	if (newVolume <= MIN_VOLUME || newVolume >= MAX_VOLUME) {
		embed.setDescription(
			await translateContext(interaction.guild!, amount > 0 ? "music/volume:TOO_MUCH" : "music/volume:TOO_LOW"),
		);

		await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });

		return;
	}

	await player.setVolume(Math.max(Math.min(newVolume, 100), 1));

	embed.setDescription(
		await translateContext(interaction.guild!, "music/volume:SUCCESS", {
			volume: newVolume,
		}),
	);

	await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
};

const handleLoop = async (interaction: ButtonInteraction, player: PlayerCustom): Promise<void> => {
	const embed = createEmbed();
	let newMode: RepeatMode;

	switch (player.repeatMode) {
		case "off":
			newMode = "track";
			break;

		case "track":
			newMode = "queue";
			break;

		case "queue":
			newMode = "off";
			break;

		default:
			newMode = "off";
	}

	player.setRepeatMode(newMode);

	embed.setDescription(await translateContext(interaction.guild!, `music/loop:SUCCESS_${newMode.toUpperCase()}`));

	await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
};
