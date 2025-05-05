import { asyncForEach, editReplyError, getLocalizedDesc, getXpForNextLevel, translateContext } from "@/helpers/functions.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import useClient from "@/utils/use-client.js";
import {
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	ContainerBuilder,
	InteractionContextType,
	MessageFlags,
	SectionBuilder,
	SeparatorSpacingSize,
	TextDisplayBuilder,
} from "discord.js";

const client = useClient();

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
	if (userData.lover && !client.users.cache.has(userData.lover)) await client.users.fetch(userData.lover);

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
		${await translateContext(interaction, "economy/profile:CREDITS", { credits: memberData.money })}
		${await translateContext(interaction, "economy/profile:BANK", { credits: memberData.bankSold })}
		${await translateContext(interaction, "economy/profile:GLOBAL", { credits: globalMoney })}
		${await translateContext(interaction, "economy/profile:REPUTATION", { rep: userData.rep })}
		${await translateContext(interaction, "economy/profile:LEVEL", { level: memberData.level })}
		${await translateContext(interaction, "economy/profile:XP", { xp: memberData.exp, totalXp: getXpForNextLevel(memberData.level) })}
		${await translateContext(interaction, "economy/profile:BIRTHDATE", { credits: userData.birthdate || notDefined })}
		${await translateContext(interaction, "economy/profile:LOVER", { user: lover?.toString() || notDefined })}
		${await translateContext(interaction, "economy/profile:REGISTERED", { date: `<t:${Math.floor(memberData.registeredAt / 1000)}:f>` })}
	`;

	const container = new ContainerBuilder()
		.addSectionComponents(
			new SectionBuilder()
				.setThumbnailAccessory(t => t.setURL(user.avatarURL({ size: 2048 }) || ""))
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(`
						# ${await translateContext(interaction, "economy/profile:TITLE", { user: user.toString() })}
						${userData.bio ? `### ${userData.bio}` : ""}`),
				)
		)
		.addSeparatorComponents(s => s.setSpacing(SeparatorSpacingSize.Small).setDivider(true))
		.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(content)
		);

	interaction.editReply({
		components: [container],
		flags: MessageFlags.IsComponentsV2,
		allowedMentions: {
			parse: [],
		},
	});
};
