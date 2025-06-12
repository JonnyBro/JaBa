import {
	asyncForEach,
	editReplyError,
	getLocalizedDesc,
	getXpForNextLevel,
	translateContext,
} from "@/helpers/functions.js";
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
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
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
	if (user.bot) return editReplyError(interaction, "misc:BOT_USER");

	const memberData = await client.getMemberData(user.id, interaction.guildId!);
	const userData = await client.getUserData(user.id);

	let globalMoney = 0;
	const guilds = client.guilds.cache.filter(g => g.members.cache.has(user.id));
	const guldsArray = Array.from(guilds.values());

	await asyncForEach(guldsArray, async guild => {
		const data = await client.getMemberData(user.id, guild.id);
		globalMoney += data.money + data.bank;
	});

	const notDefined = await translateContext(interaction, "common:NOT_DEFINED");

	const content = `
${await translateContext(interaction, "economy/profile:CREDITS", {
	credits: memberData.money,
})}
${await translateContext(interaction, "economy/profile:BANK", {
	credits: memberData.bank,
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
${await translateContext(interaction, "economy/profile:REGISTERED", {
	date: `<t:${Math.floor(memberData.registeredAt / 1000)}:f>`,
})}`;

	const container = new ContainerBuilder()
		.addSectionComponents(
			new SectionBuilder()
				.setThumbnailAccessory(t => t.setURL(user.avatarURL() || client.user.avatarURL()!))
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`# ${user.toString()}${userData.bio ? `\n## ${userData.bio}` : ""}\n`,
					),
				),
		)
		.addSeparatorComponents(s => s.setSpacing(SeparatorSpacingSize.Small).setDivider(true))
		.addTextDisplayComponents(t => t.setContent(content));

	interaction.editReply({
		flags: MessageFlags.IsComponentsV2,
		components: [container],
		allowedMentions: {
			parse: [],
		},
	});
};
