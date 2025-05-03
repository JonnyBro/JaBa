import { getLocalizedDesc, translateContext } from "@/helpers/extenders.js";
import { getNoun } from "@/helpers/functions.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import useClient from "@/utils/use-client.js";
import {
	ActionRowBuilder,
	ApplicationIntegrationType,
	ContainerBuilder,
	InteractionContextType,
	MessageFlags,
	SeparatorSpacingSize,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	TextDisplayBuilder,
} from "discord.js";

const client = useClient();

interface LeaderboardItem {
	id: string;
	level?: number;
	money?: number;
	rep?: number;
	xp?: number;
}

// NOTE: Refactor please :3
client.on("interactionCreate", async interaction => {
	if (!interaction.isStringSelectMenu()) return;

	const selected = interaction.values[0];
	const container = new ContainerBuilder();
	const titleText = new TextDisplayBuilder().setContent(
		`# ${await translateContext(interaction, "economy/leaderboard:TITLE", {
			name: interaction.guild?.name,
		})}`,
	);

	if (interaction.customId === "leaderboard_selector") {
		switch (selected) {
			case "credits": {
				const leaderboard: Array<LeaderboardItem> = [];
				const membersData = await client.getMembersData(interaction.guildId!);
				const membersDataArray = Array.from(membersData.values());
				membersDataArray.forEach(member => {
					leaderboard.push({
						id: member.id,
						money: member.money + member.bankSold,
					});
				});

				leaderboard.sort((a, b) => b.money! - a.money!);
				if (leaderboard.length > 20) leaderboard.length = 20;

				let tableText = "";

				for (let i = 0; i < leaderboard.length; i++) {
					const data = leaderboard[i];

					tableText += `**${i + 1}**. <@${data.id}>: **${data.money}** ${getNoun(
						data.money!,
						[
							await translateContext(interaction, "misc:NOUNS:CREDIT:1"),
							await translateContext(interaction, "misc:NOUNS:CREDIT:2"),
							await translateContext(interaction, "misc:NOUNS:CREDIT:5"),
						],
					)}\n`;
				}

				const table = new TextDisplayBuilder().setContent(tableText);

				const subTitleText = new TextDisplayBuilder().setContent(
					`## ${await translateContext(interaction, "common:CREDITS")}`,
				);

				container
					.addTextDisplayComponents(titleText)
					.addTextDisplayComponents(subTitleText)
					.addSeparatorComponents(s => s.setSpacing(SeparatorSpacingSize.Small))
					.addTextDisplayComponents(table);

				interaction.message.edit({
					components: [container],
					allowedMentions: {
						parse: [],
					},
				});

				break;
			}

			case "level": {
				const leaderboard: Array<LeaderboardItem> = [];
				const membersData = await client.getMembersData(interaction.guildId!);
				const membersDataArray = Array.from(membersData.values());
				membersDataArray.forEach(member => {
					leaderboard.push({
						id: member.id,
						level: member.level,
						xp: member.exp,
					});
				});

				leaderboard.sort((a, b) => b.level! - a.level!);
				if (leaderboard.length > 20) leaderboard.length = 20;

				let tableText = "";

				for (let i = 0; i < leaderboard.length; i++) {
					const data = leaderboard[i];

					tableText += `**${i + 1}**. <@${data.id}>: **${data.level}** ${getNoun(
						data.level!,
						[
							await translateContext(interaction, "misc:NOUNS:LEVEL:1"),
							await translateContext(interaction, "misc:NOUNS:LEVEL:2"),
							await translateContext(interaction, "misc:NOUNS:LEVEL:5"),
						],
					)} (${data.xp} / ${
						5 * (data.level! * data.level!) + 80 * data.level! + 100
					} ${getNoun(data.xp!, [
						await translateContext(interaction, "misc:NOUNS:XP:1"),
						await translateContext(interaction, "misc:NOUNS:XP:2"),
						await translateContext(interaction, "misc:NOUNS:XP:5"),
					])})\n`;
				}

				const table = new TextDisplayBuilder().setContent(tableText);

				const subTitleText = new TextDisplayBuilder().setContent(
					`## ${await translateContext(interaction, "common:LEVEL")}`,
				);

				container
					.addTextDisplayComponents(titleText)
					.addTextDisplayComponents(subTitleText)
					.addSeparatorComponents(s => s.setSpacing(SeparatorSpacingSize.Small))
					.addTextDisplayComponents(table);

				interaction.message.edit({
					components: [container],
					allowedMentions: {
						parse: [],
					},
				});

				break;
			}

			case "rep": {
				const leaderboard: Array<LeaderboardItem> = [];
				const usersData = await client.getUsersData();
				const usersDataArray = Array.from(usersData.values());
				usersDataArray.forEach(user => {
					leaderboard.push({
						id: user.id,
						rep: user.rep,
					});
				});

				leaderboard.sort((a, b) => b.level! - a.level!);
				if (leaderboard.length > 20) leaderboard.length = 20;

				let tableText = "";

				for (let i = 0; i < leaderboard.length; i++) {
					const data = leaderboard[i];

					tableText += `**${i + 1}**. <@${data.id}>: **${data.rep}** ${getNoun(
						data.rep!,
						[
							await translateContext(interaction, "misc:NOUNS:POINTS:1"),
							await translateContext(interaction, "misc:NOUNS:POINTS:2"),
							await translateContext(interaction, "misc:NOUNS:POINTS:5"),
						],
					)}\n`;
				}

				const table = new TextDisplayBuilder().setContent(tableText);

				const subTitleText = new TextDisplayBuilder().setContent(
					`## ${await translateContext(interaction, "common:REP")}`,
				);

				container
					.addTextDisplayComponents(titleText)
					.addTextDisplayComponents(subTitleText)
					.addSeparatorComponents(s => s.setSpacing(SeparatorSpacingSize.Small))
					.addTextDisplayComponents(table);

				interaction.message.edit({
					components: [container],
					allowedMentions: {
						parse: [],
					},
				});

				break;
			}

			default:
				return interaction.message.edit("balls");
		}
	}
});

export const data: CommandData = {
	name: "leaderboard",
	...getLocalizedDesc("economy/leaderboard:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	options: [],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply();

	const container = new ContainerBuilder();
	const titleText = new TextDisplayBuilder().setContent(
		`# ${await translateContext(interaction, "economy/leaderboard:TITLE", {
			name: interaction.guild?.name,
		})}`,
	);

	const selectText = new TextDisplayBuilder().setContent(
		await translateContext(interaction, "economy/leaderboard:SELECT", {
			name: `**${interaction.guild?.name}**`,
		}),
	);

	const selector = new StringSelectMenuBuilder()
		.setCustomId("leaderboard_selector")
		.setOptions(
			new StringSelectMenuOptionBuilder()
				.setLabel("Credits")
				.setEmoji("💰")
				.setValue("credits"),
			new StringSelectMenuOptionBuilder()
				.setLabel("Level")
				.setEmoji("🆙")
				.setValue("level"),
			new StringSelectMenuOptionBuilder()
				.setLabel("Reputation")
				.setEmoji("😎")
				.setValue("rep"),
		);

	const row = new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(selector);

	container
		.addTextDisplayComponents(titleText)
		.addSeparatorComponents(s => s.setSpacing(SeparatorSpacingSize.Small))
		.addTextDisplayComponents(selectText)
		.addActionRowComponents(row);

	interaction.editReply({
		components: [container],
		flags: MessageFlags.IsComponentsV2,
	});
};
