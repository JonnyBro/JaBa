import { editReplyError, getLocalizedDesc, translateContext } from "@/helpers/functions.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import { createEmbed } from "@/utils/create-embed.js";
import useClient from "@/utils/use-client.js";
import {
	ActionRowBuilder,
	ApplicationIntegrationType, ButtonBuilder,
	ButtonStyle,
	Interaction,
	InteractionContextType,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} from "discord.js";
import { RainlinkPlayer } from "rainlink";

const client = useClient();

export const data: CommandData = {
	name: "queue",
	...getLocalizedDesc("music/queue:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [
		ApplicationIntegrationType.GuildInstall,
	],
	contexts: [
		InteractionContextType.Guild,
	],
	options: [],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply();

	const player = client.rainlink.players.get(interaction.guildId!);
	if (!player) return editReplyError(interaction, "music/play:NOT_PLAYING");

	const { embeds, size } = await generateQueueEmbeds(interaction, player);
	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setCustomId("queue_prev_page")
			.setStyle(ButtonStyle.Primary)
			.setEmoji("⬅️"),
		new ButtonBuilder()
			.setCustomId("queue_next_page")
			.setStyle(ButtonStyle.Primary)
			.setEmoji("➡️"),
		new ButtonBuilder()
			.setCustomId("queue_jump_page")
			.setStyle(ButtonStyle.Secondary)
			.setEmoji("↗️"),
		new ButtonBuilder()
			.setCustomId("queue_stop")
			.setStyle(ButtonStyle.Danger)
			.setEmoji("❌"),
	);

	await interaction.editReply({
		content: `${await translateContext(interaction, "common:PAGE")}: **1**/**${size}**`,
		embeds: [embeds[0]],
		components: [row],
	});
};

client.on("interactionCreate", async interaction => {
	if (!interaction.isButton()) return;

	if (interaction.customId.startsWith("queue_")) {
		const player = client.rainlink.players.get(interaction.guildId!);
		if (!player) return editReplyError(interaction, "music/play:NOT_PLAYING");

		let currentPage = Number(
			interaction.message.content.match(/\*\*[0-9]+\*\*\/\*\*[0-9]+\*\*/g)![0].split("/")[0],
		);

		const { embeds, size } = await generateQueueEmbeds(interaction, player);

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setCustomId("queue_prev_page")
				.setStyle(ButtonStyle.Primary)
				.setEmoji("⬅️"),
			new ButtonBuilder()
				.setCustomId("queue_next_page")
				.setStyle(ButtonStyle.Primary)
				.setEmoji("➡️"),
			new ButtonBuilder()
				.setCustomId("queue_jump_page")
				.setStyle(ButtonStyle.Secondary)
				.setEmoji("↗️"),
			new ButtonBuilder()
				.setCustomId("queue_stop")
				.setStyle(ButtonStyle.Danger)
				.setEmoji("❌"),
		);

		switch (interaction.customId) {
			case "queue_prev_page": {
				await interaction.deferUpdate();

				if (currentPage !== 0) {
					--currentPage;

					interaction.editReply({
						content: `${
							await translateContext(interaction, "common:PAGE")
						}: **${currentPage + 1}**/**${size}**`,
						embeds: [embeds[currentPage]],
						components: [row],
					});
				}

				break;
			}

			case "queue_next_page": {
				await interaction.deferUpdate();

				if (currentPage < size - 1) {
					currentPage++;

					interaction.editReply({
						content: `${
							await translateContext(interaction, "common:PAGE")
						}: **${currentPage + 1}**/**${size}**`,
						embeds: [embeds[currentPage]],
						components: [row],
					});
				}

				break;
			}

			case "queue_jump_page": {
				const m = await interaction.deferUpdate();

				const selectMenu = new StringSelectMenuBuilder()
					.setCustomId("queue_select")
					.setPlaceholder(await translateContext(interaction, "common:NOTHING_SELECTED"));

				for (let i = 0; i < size; i++) {
					selectMenu.addOptions(
						new StringSelectMenuOptionBuilder().setLabel(`${i + 1}`).setValue(`${i}`),
					);
				}

				const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>()
					.addComponents(selectMenu);

				let page = 0;

				await interaction.followUp({
					components: [selectRow],
				});

				client.once("interactionCreate", async interaction => {
					if (!interaction.isStringSelectMenu()) return;

					await interaction.deferUpdate();

					if (interaction.customId === "queue_select") {
						page = Number(interaction.values[0]);

						if (interaction.message.deletable) interaction.message.delete();
					}

					m.edit({
						content: `${
							await translateContext(interaction, "common:PAGE")
						}: **${page + 1}**/**${size}**`,
						embeds: [embeds[page]],
						components: [row],
					});
				});

				break;
			}

			case "queue_stop": {
				await interaction.deferUpdate();

				row.components.forEach(component => {
					component.setDisabled(true);
				});

				interaction.editReply({
					components: [row],
				});

				break;
			}
		}
	}
});

async function generateQueueEmbeds(
	interaction: Interaction,
	player: RainlinkPlayer,
) {
	const embeds = [];
	const currentTrack = player.queue.current!;
	const queue = player.queue;
	const translated = {
		none: await translateContext(interaction, "common:DISABLED"),
		song: await translateContext(interaction, "music/loop:TRACK"),
		queue: await translateContext(interaction, "music/loop:QUEUE"),
	};
	const embed = createEmbed({
		title: await translateContext(interaction, "music/nowplaying:CURRENTLY_PLAYING"),
	}).setThumbnail(currentTrack?.artworkUrl || null);

	let k = 10;

	if (!queue.length) {
		embed.setDescription(
			`${await translateContext(interaction, "music/nowplaying:REPEAT")}: \`${
				translated[player.loop]
			}\`\n[${currentTrack.title}](${currentTrack.uri})\n> ${await translateContext(
				interaction,
				"music/queue:ADDED",
			)} ${currentTrack.requester}\n\n**${await translateContext(
				interaction,
				"music/queue:NEXT",
			)}**\n${await translateContext(interaction, "music/queue:NO_QUEUE")}`,
		);

		embeds.push(embed);

		return { embeds: embeds, size: embeds.length };
	}

	for (let i = 0; i < queue.length; i += 10) {
		const current = queue.slice(i, k);
		let j = i;
		k += 10;

		const addedText = await translateContext(interaction, "music/queue:ADDED");

		const info = current.map(
			track => `${++j}. [${track.title}](${track.uri})\n> ${addedText} ${track.requester}`,
		);

		embed.setDescription(
			`${await translateContext(interaction, "music/nowplaying:REPEAT")}: \`${
				translated[player.loop]
			}\`\n[${currentTrack.title}](${currentTrack.uri})\n * ${await translateContext(
				interaction,
				"music/queue:ADDED",
			)} ${
				currentTrack.requester
			}\n\n**${await translateContext(interaction, "music/queue:NEXT")}**\n${info}`,
		);

		embeds.push(embed);
	}

	return { embeds: embeds, size: embeds.length };
}
