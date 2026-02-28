import { capitalizeString, convertTime, formatString, translateContext } from "@/helpers/functions.js";
import logger from "@/helpers/logger.js";
import { RainlinkPlayerCustom } from "@/types.js";
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

const MAX_VOLUME = 100;
const MIN_VOLUME = 0;

export const data = {
	name: "trackStart",
	player: true,
	once: false,
};

export async function run(player: RainlinkPlayerCustom, track: RainlinkTrack) {
	if (!player || !track) return;

	const guild = client.guilds.cache.get(player.guildId);
	if (!guild) return;

	try {
		if (debug) {
			const g = guild;
			const trackTitle = formatString(track?.title || "Unknown", 30).replace(/ - Topic$/, "");
			logger.debug(`Track started in ${g.name} (${g.id})\nTrack: ${trackTitle}\nURL: ${track.uri}`);
		}

		const trackEmbed = await createTrackEmbed(player, track, player.guildId);
		const buttons = buildControlButtons(player);

		const channel = client.channels.cache.get(player.textId);
		if (!channel || !channel.isSendable()) return;

		player.message = await channel.send({
			embeds: [trackEmbed],
			components: buttons,
		});

		const collector = player.message.createMessageComponentCollector({
			time: 600_000, // 10 mins
		});

		collector.on("collect", async (interaction: ButtonInteraction) => {
			if (!player) return collector.stop();

			try {
				const member = interaction.member as GuildMember;
				if (!member.voice.channel || player.voiceId !== member.voice.channelId) {
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

						if (player.queue.isEmpty) {
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

						await player.previous();

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

						if (player.queue.isEmpty && !guildData.plugins.music.autoPlay) {
							const embed = createEmbed({
								description: await translateContext(guild, "music/queue:NO_QUEUE"),
							});

							await interaction.followUp({
								embeds: [embed],
								flags: MessageFlags.Ephemeral,
							});

							return;
						}

						player.skip();

						break;
					}

					case ButtonId.STOP_BUTTON_ID:
						await interaction.deferUpdate();

						await player.stop(true);

						collector.stop();

						break;
				}
			} catch (e) {
				logger.error("[trackStart] Error handling button interaction:", e);

				await interaction.reply({
					content: "unfunny error happened",
					flags: MessageFlags.Ephemeral,
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

const createTrackEmbed = async (
	player: RainlinkPlayerCustom,
	track: RainlinkTrack,
	guildId: string,
): Promise<EmbedBuilder> => {
	const guild = client.guilds.cache.get(guildId);
	if (!guild) throw logger.error("[trackStart] Guild not found");

	const trackTitle = formatString(track?.title || "Unknown", 30).replace(/ - Topic$/, "");
	const trackAuthor = formatString(track?.author || "Unknown", 25).replace(/ - Topic$/, "");
	const trackDuration = track.isStream ? ":red_circle:" : `\`${convertTime(track.duration)}\``;
	const trackRequester = track.requester as User;

	const embed = createEmbed({
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
				value: `${capitalizeString(track.source)}`,
				inline: true,
			},
			{
				name: await translateContext(guild, "music/queue:DURATION"),
				value: trackDuration,
				inline: true,
			},
			{
				name: await translateContext(guild, "music/queue:ADDED"),
				value: trackRequester.toString() || "Unknown",
				inline: true,
			},
		],
	}).setThumbnail(track?.artworkUrl || null);

	const nextTrack = player.queue[0];
	if (nextTrack) {
		const nextTrackTitle = formatString(nextTrack.title || "Unknown", 30).replace(/ - Topic$/, "");
		const nextTrackAuthor = formatString(nextTrack.author || "Unknown", 25).replace(/ - Topic$/, "");

		embed.addFields({
			name: await translateContext(guild, "music/queue:NEXT"),
			value: `**[${nextTrackTitle} - ${nextTrackAuthor}](${nextTrack.uri})**`,
		});
	}

	return embed;
};

const buildControlButtons = (
	player: RainlinkPlayerCustom,
): [ActionRowBuilder<ButtonBuilder>, ActionRowBuilder<ButtonBuilder>] => {
	const buttons1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setCustomId(ButtonId.PLAY_PAUSE_BUTTON_ID)
			.setEmoji(player.paused ? "▶️" : "⏸️")
			.setStyle(player.paused ? ButtonStyle.Primary : ButtonStyle.Secondary),
		new ButtonBuilder().setCustomId(ButtonId.VOLUMEDOWN_BUTTON_ID).setEmoji("➖").setStyle(ButtonStyle.Secondary),
		new ButtonBuilder().setCustomId(ButtonId.VOLUMEUP_BUTTON_ID).setEmoji("➕").setStyle(ButtonStyle.Secondary),
		new ButtonBuilder()
			.setCustomId(ButtonId.LOOP_BUTTON_ID)
			.setEmoji(getLoopEmoji(player.loop))
			.setStyle(getLoopStyle(player.loop)),
	);

	const buttons2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder().setCustomId(ButtonId.SHUFFLE_BUTTON_ID).setEmoji("🔀").setStyle(ButtonStyle.Secondary),
		new ButtonBuilder().setCustomId(ButtonId.PREV_BUTTON_ID).setEmoji("⏮️").setStyle(ButtonStyle.Secondary),
		new ButtonBuilder().setCustomId(ButtonId.SKIP_BUTTON_ID).setEmoji("⏭️").setStyle(ButtonStyle.Secondary),
		new ButtonBuilder().setCustomId(ButtonId.STOP_BUTTON_ID).setEmoji("❌").setStyle(ButtonStyle.Danger),
	);

	return [buttons1, buttons2];
};

const getLoopEmoji = (mode: RainlinkLoopMode): string => {
	switch (mode) {
		case RainlinkLoopMode.SONG:
			return "🔂";
		case RainlinkLoopMode.QUEUE:
			return "🔁";
		default:
			return "🔃";
	}
};

const getLoopStyle = (mode: RainlinkLoopMode): ButtonStyle =>
	mode !== RainlinkLoopMode.NONE ? ButtonStyle.Primary : ButtonStyle.Secondary;

const updatePlayerMessage = async (
	player: RainlinkPlayerCustom,
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
	player: RainlinkPlayerCustom,
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
	player: RainlinkPlayerCustom,
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

const handleLoop = async (interaction: ButtonInteraction, player: RainlinkPlayerCustom): Promise<void> => {
	const embed = createEmbed();
	let newLoopMode;

	switch (player.loop) {
		case "none":
			newLoopMode = RainlinkLoopMode.SONG;
			break;

		case "song":
			newLoopMode = RainlinkLoopMode.QUEUE;
			break;

		case "queue":
			newLoopMode = RainlinkLoopMode.NONE;
			break;

		default:
			newLoopMode = RainlinkLoopMode.NONE;
	}

	player.setLoop(newLoopMode);

	embed.setDescription(await translateContext(interaction.guild!, `music/loop:SUCCESS_${newLoopMode.toUpperCase()}`));

	await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
};
