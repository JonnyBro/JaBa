import { editReplyError, editReplySuccess, getLocalizedDesc, translateContext } from "@/helpers/functions.js";
import {
	addServer,
	DEFAULT_FIELDS,
	deleteStatus,
	gameAutocomplete,
	getDefaultPort,
	getGame,
	MAX_INTERVAL,
	MAX_SERVERS,
	MIN_INTERVAL,
	parseAddress,
} from "@/helpers/game-servers.js";
import GameServerModel from "@/models/GameServerModel.js";
import { AutocompleteProps, CommandData, SlashCommandProps } from "@/types.js";
import { containerMessage, createContainer, createText } from "@/utils/create-container.js";
import {
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	ChannelType,
	InteractionContextType,
	MessageFlags,
	PermissionsBitField,
} from "discord.js";
import { Types } from "mongoose";

export const data: CommandData = {
	name: "gameserver",
	...getLocalizedDesc("administration/gameserver:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	// eslint-disable-next-line camelcase
	default_member_permissions: String(PermissionsBitField.Flags.ManageGuild),
	options: [
		{
			name: "add",
			...getLocalizedDesc("administration/gameserver:ADD"),
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "game",
					...getLocalizedDesc("gameservers:GAME_OPTION"),
					type: ApplicationCommandOptionType.String,
					required: true,
					autocomplete: true,
				},
				{
					name: "address",
					...getLocalizedDesc("gameservers:ADDRESS_OPTION"),
					type: ApplicationCommandOptionType.String,
					required: true,
				},
				{
					name: "channel",
					...getLocalizedDesc("administration/gameserver:CHANNEL"),
					type: ApplicationCommandOptionType.Channel,
					// eslint-disable-next-line camelcase
					channel_types: [ChannelType.GuildText, ChannelType.GuildAnnouncement],
				},
				{
					name: "title",
					...getLocalizedDesc("administration/gameserver:TITLE"),
					type: ApplicationCommandOptionType.String,
					// eslint-disable-next-line camelcase
					max_length: 100,
				},
				{
					name: "interval",
					...getLocalizedDesc("administration/gameserver:INTERVAL"),
					type: ApplicationCommandOptionType.Integer,
					// eslint-disable-next-line camelcase
					min_value: MIN_INTERVAL,
					// eslint-disable-next-line camelcase
					max_value: MAX_INTERVAL,
				},
			],
		},
		{
			name: "remove",
			...getLocalizedDesc("administration/gameserver:REMOVE"),
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "server",
					...getLocalizedDesc("administration/gameserver:SERVER"),
					type: ApplicationCommandOptionType.String,
					required: true,
					autocomplete: true,
				},
			],
		},
		{
			name: "list",
			...getLocalizedDesc("administration/gameserver:LIST"),
			type: ApplicationCommandOptionType.Subcommand,
		},
	],
};

const serverLabel = (server: { title: string | null; host: string; port: number }) =>
	server.title ? `${server.title} (${server.host}:${server.port})` : `${server.host}:${server.port}`;

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply({ flags: MessageFlags.Ephemeral });

	const guild = interaction.guild!;
	const subcommand = interaction.options.getSubcommand();

	if (subcommand === "add") {
		const game = interaction.options.getString("game", true);
		if (!getGame(game)) return editReplyError(interaction, "gameservers:ERRORS:UNKNOWN_GAME");

		const address = parseAddress(interaction.options.getString("address", true));
		if (!address) return editReplyError(interaction, "gameservers:ERRORS:ADDRESS");

		const port = address.port ?? getDefaultPort(game);
		if (!port) return editReplyError(interaction, "gameservers:ERRORS:PORT");

		const picked = interaction.options.getChannel("channel");
		const channel = guild.channels.cache.get(picked?.id ?? interaction.channelId);
		if (!channel?.isTextBased() || !channel.isSendable())
			return editReplyError(interaction, "gameservers:ERRORS:CHANNEL");

		const result = await addServer(guild, {
			game,
			host: address.host,
			port,
			channelId: channel.id,
			title: interaction.options.getString("title"),
			description: null,
			fields: DEFAULT_FIELDS,
			connectButton: true,
			interval: interaction.options.getInteger("interval") ?? MIN_INTERVAL,
		});
		if ("error" in result)
			return editReplyError(interaction, `gameservers:ERRORS:${result.error}`, { max: MAX_SERVERS });

		return editReplySuccess(interaction, "administration/gameserver:ADDED", {
			server: serverLabel(result.server),
			channel: channel.toString(),
		});
	}

	if (subcommand === "remove") {
		const id = interaction.options.getString("server", true);
		const server = Types.ObjectId.isValid(id)
			? await GameServerModel.findOneAndDelete({ _id: id, guildId: guild.id }).lean()
			: null;
		if (!server) return editReplyError(interaction, "administration/gameserver:NOT_FOUND");

		await deleteStatus(guild, server);

		return editReplySuccess(interaction, "administration/gameserver:REMOVED", { server: serverLabel(server) });
	}

	const servers = await GameServerModel.find({ guildId: guild.id }).sort({ createdAt: 1 }).lean();
	if (!servers.length) return editReplyError(interaction, "administration/gameserver:EMPTY");

	const lines = servers.map(server => {
		const link = server.messageId
			? ` · https://discord.com/channels/${guild.id}/${server.channelId}/${server.messageId}`
			: "";

		return `${server.online ? "🟢" : "🔴"} **${serverLabel(server)}** · <#${server.channelId}>${link}`;
	});

	await interaction.editReply(
		containerMessage(
			createContainer().addTextDisplayComponents(
				createText(
					[
						`### ${await translateContext(interaction, "administration/gameserver:LIST_TITLE")}`,
						...lines,
					].join("\n"),
				),
			),
		),
	);
};

export const autocompleteRun = async ({ interaction }: AutocompleteProps) => {
	const focused = interaction.options.getFocused(true);

	if (focused.name === "game") return interaction.respond(gameAutocomplete(focused.value));

	const query = focused.value.toLowerCase();
	const servers = await GameServerModel.find({ guildId: interaction.guildId! }).lean();

	await interaction.respond(
		servers
			.map(server => ({ name: serverLabel(server).slice(0, 100), value: server._id.toString() }))
			.filter(choice => choice.name.toLowerCase().includes(query))
			.slice(0, 25),
	);
};
