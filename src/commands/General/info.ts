import {
	formatReply,
	getLocalizedDesc,
	getNoun,
	getUsername,
	translateContext,
} from "@/helpers/functions.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import { createEmbed } from "@/utils/create-embed.js";
import {
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	ChannelType,
	ChatInputCommandInteraction,
	GuildMember,
	InteractionContextType,
} from "discord.js";

export const data: CommandData = {
	name: "info",
	...getLocalizedDesc("general/info:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	options: [
		{
			name: "user",
			...getLocalizedDesc("general/info:USER"),
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "user",
					...getLocalizedDesc("common:USER"),
					type: ApplicationCommandOptionType.User,
				},
			],
		},
		{
			name: "server",
			...getLocalizedDesc("general/info:SERVER"),
			type: ApplicationCommandOptionType.Subcommand,
		},
	],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply();

	const command = interaction.options.getSubcommand();

	if (command === "user") {
		const member = (interaction.options.getMember("user") || interaction.member) as GuildMember;
		const embed = await getUserInfo(interaction, member);

		return interaction.editReply({
			embeds: [embed],
		});
	} else {
		const embed = await getServerInfo(interaction);

		return interaction.editReply({
			embeds: [embed],
		});
	}
};

async function getUserInfo(interaction: ChatInputCommandInteraction, member: GuildMember) {
	const rolesCache = member.roles.cache;
	const roles =
		rolesCache.size < 1
			? await translateContext(interaction, "genera/info:NO_ROLE")
			: rolesCache.size > 10
				? rolesCache
					.map(r => r)
					.filter(r => r.id !== interaction.guild?.roles.everyone.id)
					.slice(0, 10)
					.join(", ") +
					" " +
					(await translateContext(interaction, "general/info:MORE_ROLES", {
						count: rolesCache.size - 10,
					}))
				: rolesCache
					.map(r => r)
					.filter(r => r.id !== interaction.guild?.roles.everyone.id)
					.slice(0, 10)
					.join(", ");

	const embed = createEmbed({
		author: {
			name: `${getUsername(member)} (${member.id})`,
			iconURL: member.displayAvatarURL(),
		},
		fields: [
			{
				name: `:man: ${await translateContext(interaction, "common:USERNAME")}`,
				value: getUsername(member),
				inline: true,
			},
			{
				name: formatReply(await translateContext(interaction, "common:NICKNAME"), "pencil"),
				value:
					member.nickname ||
					(await translateContext(interaction, "general/info:NO_NICKNAME")),
				inline: true,
			},
			{
				name: formatReply(await translateContext(interaction, "common:BOT"), "bot"),
				value: member.user.bot
					? await translateContext(interaction, "common:YES")
					: await translateContext(interaction, "common:NO"),
				inline: true,
			},
			{
				name: formatReply(
					await translateContext(interaction, "common:CREATED"),
					"calendar",
				),
				value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:D>`,
				inline: true,
			},
			{
				name: formatReply(
					await translateContext(interaction, "common:JOINED"),
					"calendar2",
				),
				value: member.joinedTimestamp
					? `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>`
					: "ERROR",
				inline: true,
			},
			{
				name: formatReply(await translateContext(interaction, "common:COLOR"), "color"),
				value: member.displayHexColor,
				inline: true,
			},
			{
				name: formatReply(await translateContext(interaction, "common:ROLES"), "roles"),
				value: roles,
				inline: true,
			},
		],
	}).setThumbnail(member.displayAvatarURL());

	return embed;
}

async function getServerInfo(interaction: ChatInputCommandInteraction) {
	const guild = interaction.guild!;
	const owner = await guild.fetchOwner();
	const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
	const voiceChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice);
	const categories = guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory);

	await guild.members.fetch();

	const embed = createEmbed({
		fields: [
			{
				name: formatReply(await translateContext(interaction, "common:NAME"), "title"),
				value: guild.name,
				inline: true,
			},
			{
				name: formatReply(
					await translateContext(interaction, "common:CREATED"),
					"calendar",
				),
				value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`,
				inline: true,
			},
			{
				name: formatReply(await translateContext(interaction, "common:MEMBERS"), "users"),
				value:
					`${guild.members.cache.filter(m => !m.user.bot).size} ${getNoun(
						guild.members.cache.filter(m => !m.user.bot).size,
						[
							await translateContext(interaction, "misc:NOUNS:MEMBERS:1"),
							await translateContext(interaction, "misc:NOUNS:MEMBERS:2"),
							await translateContext(interaction, "misc:NOUNS:MEMBERS:5"),
						],
					)}` +
					"\n" +
					`${guild.members.cache.filter(m => m.user.bot).size} ${getNoun(
						guild.members.cache.filter(m => m.user.bot).size,
						[
							await translateContext(interaction, "misc:NOUNS:BOTS:1"),
							await translateContext(interaction, "misc:NOUNS:BOTS:2"),
							await translateContext(interaction, "misc:NOUNS:BOTS:5"),
						],
					)}`,
				inline: true,
			},
			{
				name: formatReply(await translateContext(interaction, "common:AFK_CHANNEL"), "afk"),
				value:
					guild.afkChannel?.toString() ||
					(await translateContext(interaction, "common:MISSING")),
				inline: true,
			},
			{
				name: formatReply(await translateContext(interaction, "common:SERVER_ID"), "id"),
				value: guild.id,
				inline: true,
			},
			{
				name: formatReply(await translateContext(interaction, "common:OWNER"), "crown"),
				value: owner.toString(),
				inline: true,
			},
			{
				name: formatReply(
					await translateContext(interaction, "general/info:BOOSTS"),
					"boost",
				),
				value: guild.premiumSubscriptionCount?.toString() || "0",
				inline: true,
			},
			{
				name: formatReply(
					await translateContext(interaction, "common:CHANNELS"),
					"channels",
				),
				value:
					`${textChannels.size} ${getNoun(
						textChannels.size,
						[
							await translateContext(interaction, "misc:NOUNS:TEXT:1"),
							await translateContext(interaction, "misc:NOUNS:TEXT:2"),
							await translateContext(interaction, "misc:NOUNS:TEXT:5"),
						],
					)}` +
					"\n" +
					`${voiceChannels.size} ${getNoun(
						voiceChannels.size,
						[
							await translateContext(interaction, "misc:NOUNS:VOICE:1"),
							await translateContext(interaction, "misc:NOUNS:VOICE:2"),
							await translateContext(interaction, "misc:NOUNS:VOICE:5"),
						],
					)}` +
					"\n" +
					`${categories.size} ${getNoun(
						categories.size,
						[
							await translateContext(interaction, "misc:NOUNS:CATEGORY:1"),
							await translateContext(interaction, "misc:NOUNS:CATEGORY:2"),
							await translateContext(interaction, "misc:NOUNS:CATEGORY:5"),
						],
					)}`,
				inline: true,
			},
		],
	}).setThumbnail(guild.iconURL());

	return embed;
}
