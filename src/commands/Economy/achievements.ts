import { editReplyError, getLocalizedDesc, translateContext } from "@/helpers/functions.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import useClient from "@/utils/use-client.js";
import {
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	ButtonInteraction,
	ChatInputCommandInteraction,
	ContainerBuilder,
	InteractionContextType,
	MessageFlags,
	User,
} from "discord.js";

const client = useClient();

export const createAchievementsContainer = async (
	interaction: ChatInputCommandInteraction | ButtonInteraction,
	user: User,
) => {
	const userData = await client.getUserData(user.id);

	const content = `
- ${await translateContext(interaction, "economy/achievements:SEND_CMD")}
	- ${await translateContext(interaction, "economy/achievements:PROGRESS", {
		now: userData.achievements.firstCommand.progress.now,
		total: userData.achievements.firstCommand.progress.total,
		percent: Math.round(
			100 *
				(userData.achievements.firstCommand.progress.now /
					userData.achievements.firstCommand.progress.total),
		),
	})}
- ${await translateContext(interaction, "economy/achievements:CLAIM_SALARY")}
	- ${await translateContext(interaction, "economy/achievements:PROGRESS", {
		now: userData.achievements.work.progress.now,
		total: userData.achievements.work.progress.total,
		percent: Math.round(
			100 *
				(userData.achievements.work.progress.now /
					userData.achievements.work.progress.total),
		),
	})}
- ${await translateContext(interaction, "economy/achievements:MARRY")}
	- ${await translateContext(interaction, "economy/achievements:PROGRESS", {
		now: userData.achievements.married.progress.now,
		total: userData.achievements.married.progress.total,
		percent: Math.round(
			100 *
				(userData.achievements.married.progress.now /
					userData.achievements.married.progress.total),
		),
	})}
- ${await translateContext(interaction, "economy/achievements:SLOTS")}
	- ${await translateContext(interaction, "economy/achievements:PROGRESS", {
		now: userData.achievements.slots.progress.now,
		total: userData.achievements.slots.progress.total,
		percent: Math.round(
			100 *
				(userData.achievements.slots.progress.now /
					userData.achievements.slots.progress.total),
		),
	})}
- ${await translateContext(interaction, "economy/achievements:TIP")}
	- ${await translateContext(interaction, "economy/achievements:PROGRESS", {
		now: userData.achievements.tip.progress.now,
		total: userData.achievements.tip.progress.total,
		percent: Math.round(
			100 *
				(userData.achievements.tip.progress.now / userData.achievements.tip.progress.total),
		),
	})}
- ${await translateContext(interaction, "economy/achievements:REP")}
	- ${await translateContext(interaction, "economy/achievements:PROGRESS", {
		now: userData.achievements.rep.progress.now,
		total: userData.achievements.rep.progress.total,
		percent: Math.round(
			100 *
				(userData.achievements.rep.progress.now / userData.achievements.rep.progress.total),
		),
	})}
- ${await translateContext(interaction, "economy/achievements:INVITE")}
	- ${await translateContext(interaction, "economy/achievements:PROGRESS", {
		now: userData.achievements.invite.progress.now,
		total: userData.achievements.invite.progress.total,
		percent: Math.round(
			100 *
				(userData.achievements.invite.progress.now /
					userData.achievements.invite.progress.total),
		),
	})}`;

	const container = new ContainerBuilder().addTextDisplayComponents(t => t.setContent(content));

	return container;
};

export const data: CommandData = {
	name: "achievements",
	...getLocalizedDesc("economy/achievements:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [
		ApplicationIntegrationType.GuildInstall,
		ApplicationIntegrationType.UserInstall,
	],
	contexts: [
		InteractionContextType.BotDM,
		InteractionContextType.Guild,
		InteractionContextType.PrivateChannel,
	],
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
	if (user.bot) return editReplyError(interaction, "economy/profile:BOT_USER");

	const container = await createAchievementsContainer(interaction, user);

	interaction.editReply({
		flags: MessageFlags.IsComponentsV2,
		components: [container],
		allowedMentions: {
			parse: [],
		},
	});
};
