import {
	asyncForEach,
	editReplyError,
	getLocalizedDesc,
	getXpForNextLevel,
	translateContext,
} from "@/helpers/functions.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import { createEmbed } from "@/utils/create-embed.js";
import useClient from "@/utils/use-client.js";
import {
	ActionRowBuilder,
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	ButtonBuilder,
	ButtonStyle,
	ContainerBuilder,
	InteractionContextType,
	MessageFlags,
	SectionBuilder,
	SeparatorSpacingSize,
	TextDisplayBuilder,
} from "discord.js";

const client = useClient();

const ACHIEVEMENTS_BUTTON_ID = "achievements_button";

export const data: CommandData = {
	name: "profile",
	...getLocalizedDesc("economy/profile:DESCRIPTION"),
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

	const memberData = await client.getMemberData(user.id, interaction.guildId!);
	const userData = await client.getUserData(user.id);
	if (userData.lover && !client.users.cache.has(userData.lover)) {
		await client.users.fetch(userData.lover);
	}

	let globalMoney = 0;
	const guilds = client.guilds.cache.filter(g => g.members.cache.has(user.id));
	const guldsArray = Array.from(guilds.values());

	await asyncForEach(guldsArray, async guild => {
		const data = await client.getMemberData(user.id, guild.id);
		globalMoney += data.money + data.bankSold;
	});

	const lover = client.users.cache.get(userData.lover);
	const notDefined = await translateContext(interaction, "common:NOT_DEFINED");
	const content = `
${await translateContext(interaction, "economy/profile:CREDITS", {
	credits: memberData.money,
})}
${await translateContext(interaction, "economy/profile:BANK", {
	credits: memberData.bankSold,
})}
${await translateContext(interaction, "economy/profile:GLOBAL", { credits: globalMoney })}
${await translateContext(interaction, "economy/profile:REPUTATION", { rep: userData.rep })}
${await translateContext(interaction, "economy/profile:LEVEL", { level: memberData.level })}
${await translateContext(interaction, "economy/profile:XP", {
	xp: memberData.exp,
	totalXp: getXpForNextLevel(memberData.level),
})}
${await translateContext(interaction, "economy/profile:BIRTHDATE", {
	birthdate: userData.birthdate ? `<t:${Math.floor(userData.birthdate / 1000)}:f>` : notDefined,
})}
${await translateContext(interaction, "economy/profile:LOVER", {
	user: lover?.toString() || notDefined,
})}
${await translateContext(interaction, "economy/profile:REGISTERED", {
	date: `<t:${Math.floor(memberData.registeredAt / 1000)}:f>`,
})}
`;

	const container = new ContainerBuilder()
		.addSectionComponents(
			new SectionBuilder()
				.setThumbnailAccessory(t => t.setURL(user.avatarURL({ size: 2048 }) || ""))
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`# ${user.toString()}${userData.bio ? `\n## ${userData.bio}` : ""}\n`,
					),
				),
		)
		.addSeparatorComponents(s => s.setSpacing(SeparatorSpacingSize.Small).setDivider(true))
		.addTextDisplayComponents(t => t.setContent(content))
		.addActionRowComponents(
			new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setStyle(ButtonStyle.Primary)
					.setLabel(await translateContext(interaction, "economy/profile:ACHIEVEMENTS"))
					.setCustomId(`${ACHIEVEMENTS_BUTTON_ID}-${user.id}`),
			),
		);

	interaction.editReply({
		components: [container],
		flags: MessageFlags.IsComponentsV2,
		allowedMentions: {
			parse: [],
		},
	});
};

// TODO: Rewrite this with /achievements
client.on("interactionCreate", async interaction => {
	if (!interaction.isButton()) return;
	if (!interaction.customId.includes(ACHIEVEMENTS_BUTTON_ID)) return;

	await interaction.deferUpdate();

	const userId = interaction.customId.split("-")[1];
	const user = client.users.cache.get(userId);
	if (!user) return;

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
					percent: Math.round(
						100 *
							(userData.achievements.firstCommand.progress.now /
								userData.achievements.firstCommand.progress.total),
					),
				}),
			},
			{
				name: await translateContext(interaction, "economy/achievements:CLAIM_SALARY"),
				value: await translateContext(interaction, "economy/achievements:PROGRESS", {
					now: userData.achievements.work.progress.now,
					total: userData.achievements.work.progress.total,
					percent: Math.round(
						100 *
							(userData.achievements.work.progress.now /
								userData.achievements.work.progress.total),
					),
				}),
			},
			{
				name: await translateContext(interaction, "economy/achievements:MARRY"),
				value: await translateContext(interaction, "economy/achievements:PROGRESS", {
					now: userData.achievements.married.progress.now,
					total: userData.achievements.married.progress.total,
					percent: Math.round(
						100 *
							(userData.achievements.married.progress.now /
								userData.achievements.married.progress.total),
					),
				}),
			},
			{
				name: await translateContext(interaction, "economy/achievements:SLOTS"),
				value: await translateContext(interaction, "economy/achievements:PROGRESS", {
					now: userData.achievements.slots.progress.now,
					total: userData.achievements.slots.progress.total,
					percent: Math.round(
						100 *
							(userData.achievements.slots.progress.now /
								userData.achievements.slots.progress.total),
					),
				}),
			},
			{
				name: await translateContext(interaction, "economy/achievements:TIP"),
				value: await translateContext(interaction, "economy/achievements:PROGRESS", {
					now: userData.achievements.tip.progress.now,
					total: userData.achievements.tip.progress.total,
					percent: Math.round(
						100 *
							(userData.achievements.tip.progress.now /
								userData.achievements.tip.progress.total),
					),
				}),
			},
			{
				name: await translateContext(interaction, "economy/achievements:REP"),
				value: await translateContext(interaction, "economy/achievements:PROGRESS", {
					now: userData.achievements.rep.progress.now,
					total: userData.achievements.rep.progress.total,
					percent: Math.round(
						100 *
							(userData.achievements.rep.progress.now /
								userData.achievements.rep.progress.total),
					),
				}),
			},
			{
				name: await translateContext(interaction, "economy/achievements:INVITE"),
				value: await translateContext(interaction, "economy/achievements:PROGRESS", {
					now: userData.achievements.invite.progress.now,
					total: userData.achievements.invite.progress.total,
					percent: Math.round(
						100 *
							(userData.achievements.invite.progress.now /
								userData.achievements.invite.progress.total),
					),
				}),
			},
		],
	});

	interaction.message.reply({
		embeds: [embed],
	});
});
