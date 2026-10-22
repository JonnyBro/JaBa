import { formatReply, getLocalizedDesc, getNoun, getUsername, translateContext } from "@/helpers/functions.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import {
	addTextWithThumbnail,
	createContainer,
	createFooter,
	createSeparator,
	createText,
} from "@/utils/create-container.js";
import {
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	ChannelType,
	ChatInputCommandInteraction,
	GuildMember,
	InteractionContextType,
	MessageFlags,
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

	const member = (interaction.options.getMember("user") || interaction.member) as GuildMember;
	const container =
		interaction.options.getSubcommand() === "user"
			? await getUserInfo(interaction, member)
			: await getServerInfo(interaction);

	// Unlike embeds, mentions inside text displays do ping
	await interaction.editReply({
		flags: MessageFlags.IsComponentsV2,
		components: [container.addTextDisplayComponents(createFooter())],
		allowedMentions: { parse: [] },
	});
};

const MAX_ROLES = 10;

const timestamp = (ms: number) => `<t:${Math.floor(ms / 1000)}:D> (<t:${Math.floor(ms / 1000)}:R>)`;

async function getUserInfo(interaction: ChatInputCommandInteraction, member: GuildMember) {
	const t = (key: string, args?: Record<string, unknown>) => translateContext(interaction, key, args);
	const line = async (key: string, emoji: string, value: string) =>
		`${formatReply(`**${await t(key)}:**`, emoji)} ${value}`;

	const roles = member.roles.cache
		.filter(r => r.id !== interaction.guild!.roles.everyone.id)
		.sort((a, b) => b.position - a.position);

	const rolesText = roles.size
		? roles.first(MAX_ROLES).join(", ") +
			(roles.size > MAX_ROLES ? ` ${await t("general/info:MORE_ROLES", { count: roles.size - MAX_ROLES })}` : "")
		: await t("general/info:NO_ROLE");

	const container = createContainer(member.displayColor || undefined);

	addTextWithThumbnail(
		container,
		`## ${member.displayName}\n-# ${getUsername(member)} • ${member.id}`,
		member.displayAvatarURL({ size: 256 }),
	);

	return container
		.addSeparatorComponents(createSeparator())
		.addTextDisplayComponents(
			createText(
				[
					await line("common:NICKNAME", "pencil", member.nickname || (await t("general/info:NO_NICKNAME"))),
					await line("common:BOT", "bot", await t(member.user.bot ? "common:YES" : "common:NO")),
					await line("common:COLOR", "color", `\`${member.displayHexColor}\``),
				].join("\n"),
			),
		)
		.addSeparatorComponents(createSeparator())
		.addTextDisplayComponents(
			createText(
				[
					await line("common:CREATED", "calendar", timestamp(member.user.createdTimestamp)),
					await line(
						"common:JOINED",
						"calendar2",
						member.joinedTimestamp ? timestamp(member.joinedTimestamp) : "-",
					),
				].join("\n"),
			),
		)
		.addSeparatorComponents(createSeparator())
		.addTextDisplayComponents(createText(await line("common:ROLES", "roles", rolesText)));
}

async function getServerInfo(interaction: ChatInputCommandInteraction) {
	const t = (key: string, args?: Record<string, unknown>) => translateContext(interaction, key, args);
	const line = async (key: string, emoji: string, value: string) =>
		`${formatReply(`**${await t(key)}:**`, emoji)} ${value}`;
	const count = async (n: number, nounKey: string) =>
		`${n} ${getNoun(n, [await t(`${nounKey}:1`), await t(`${nounKey}:2`), await t(`${nounKey}:5`)])}`;

	const guild = interaction.guild!;
	const owner = await guild.fetchOwner();

	await guild.members.fetch();

	const humans = guild.members.cache.filter(m => !m.user.bot).size;
	const bots = guild.members.cache.size - humans;
	const channelsOfType = (type: ChannelType) => guild.channels.cache.filter(c => c.type === type).size;

	const container = createContainer();

	addTextWithThumbnail(
		container,
		`## ${guild.name}\n-# ${await t("common:SERVER_ID")}: ${guild.id}`,
		guild.iconURL({ size: 256 }),
	);

	return container
		.addSeparatorComponents(createSeparator())
		.addTextDisplayComponents(
			createText(
				[
					await line("common:OWNER", "crown", owner.toString()),
					await line("common:CREATED", "calendar", timestamp(guild.createdTimestamp)),
					await line("general/info:BOOSTS", "boost", String(guild.premiumSubscriptionCount || 0)),
					await line(
						"general/info:AFK_CHANNEL",
						"afk",
						guild.afkChannel?.toString() || (await t("common:MISSING")),
					),
				].join("\n"),
			),
		)
		.addSeparatorComponents(createSeparator())
		.addTextDisplayComponents(
			createText(
				[
					await line(
						"common:MEMBERS",
						"users",
						`${await count(humans, "misc:NOUNS:MEMBERS")} • ${await count(bots, "misc:NOUNS:BOTS")}`,
					),
					await line(
						"common:CHANNELS",
						"channels",
						[
							await count(channelsOfType(ChannelType.GuildText), "misc:NOUNS:TEXT"),
							await count(channelsOfType(ChannelType.GuildVoice), "misc:NOUNS:VOICE"),
							await count(channelsOfType(ChannelType.GuildCategory), "misc:NOUNS:CATEGORY"),
						].join(" • "),
					),
				].join("\n"),
			),
		);
}
