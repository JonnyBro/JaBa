import { getLocalizedDesc, replyError, translateContext } from "@/helpers/extenders.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import { createEmbed } from "@/utils/create-embed.js";
import useClient from "@/utils/use-client.js";
import { ApplicationCommandOptionType, ApplicationIntegrationType, InteractionContextType } from "discord.js";

const client = useClient();

export const data: CommandData = {
	name: "achievements",
	...getLocalizedDesc("economy/achievements:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall],
	contexts: [InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel],
	options: [
		{
			name: "user",
			...getLocalizedDesc("common:USER"),
			type: ApplicationCommandOptionType.User,
		},
	],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply();

	const user = interaction.options.getUser("user") || interaction.user;
	if (user.bot) return replyError(interaction, "economy/profile:BOT_USER");

	const userData = await client.getUserData(user.id);

	const embed = createEmbed({
		author: {
			name: await translateContext(interaction, "economy/achievements:TITLE"),
			iconURL: user.displayAvatarURL(),
		},
		fields: [
			{
				name: await translateContext(interaction, "economy/achievements:SEND_CMD"),
				value: await translateContext(interaction, "economy/achievements:PROGRESS", {
					now: userData.achievements.firstCommand.progress.now,
					total: userData.achievements.firstCommand.progress.total,
					percent: Math.round(100 * (userData.achievements.firstCommand.progress.now / userData.achievements.firstCommand.progress.total)),
				}),
			},
			{
				name: await translateContext(interaction, "economy/achievements:CLAIM_SALARY"),
				value: await translateContext(interaction, "economy/achievements:PROGRESS", {
					now: userData.achievements.work.progress.now,
					total: userData.achievements.work.progress.total,
					percent: Math.round(100 * (userData.achievements.work.progress.now / userData.achievements.work.progress.total)),
				}),
			},
			{
				name: await translateContext(interaction, "economy/achievements:MARRY"),
				value: await translateContext(interaction, "economy/achievements:PROGRESS", {
					now: userData.achievements.married.progress.now,
					total: userData.achievements.married.progress.total,
					percent: Math.round(100 * (userData.achievements.married.progress.now / userData.achievements.married.progress.total)),
				}),
			},
			{
				name: await translateContext(interaction, "economy/achievements:SLOTS"),
				value: await translateContext(interaction, "economy/achievements:PROGRESS", {
					now: userData.achievements.slots.progress.now,
					total: userData.achievements.slots.progress.total,
					percent: Math.round(100 * (userData.achievements.slots.progress.now / userData.achievements.slots.progress.total)),
				}),
			},
			{
				name: await translateContext(interaction, "economy/achievements:TIP"),
				value: await translateContext(interaction, "economy/achievements:PROGRESS", {
					now: userData.achievements.tip.progress.now,
					total: userData.achievements.tip.progress.total,
					percent: Math.round(100 * (userData.achievements.tip.progress.now / userData.achievements.tip.progress.total)),
				}),
			},
			{
				name: await translateContext(interaction, "economy/achievements:REP"),
				value: await translateContext(interaction, "economy/achievements:PROGRESS", {
					now: userData.achievements.rep.progress.now,
					total: userData.achievements.rep.progress.total,
					percent: Math.round(100 * (userData.achievements.rep.progress.now / userData.achievements.rep.progress.total)),
				}),
			},
			{
				name: await translateContext(interaction, "economy/achievements:INVITE"),
				value: await translateContext(interaction, "economy/achievements:PROGRESS", {
					now: userData.achievements.invite.progress.now,
					total: userData.achievements.invite.progress.total,
					percent: Math.round(100 * (userData.achievements.invite.progress.now / userData.achievements.invite.progress.total)),
				}),
			},
		],
	});

	interaction.editReply({
		embeds: [embed],
	});
};
