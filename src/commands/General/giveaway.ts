import { parseDuration } from "@/helpers/duration.js";
import { editReplyError, editReplySuccess, getLocalizedDesc, shortenString } from "@/helpers/functions.js";
import { createGiveaway, MAX_PRIZE, MAX_WINNERS, validateGiveaway } from "@/helpers/giveaways.js";
import { getShopItems, itemLabel } from "@/helpers/shop.js";
import { AutocompleteProps, CommandData, SlashCommandProps } from "@/types.js";
import {
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	ChannelType,
	InteractionContextType,
	MessageFlags,
	PermissionsBitField,
} from "discord.js";

export const data: CommandData = {
	name: "giveaway",
	...getLocalizedDesc("general/giveaway:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	// eslint-disable-next-line camelcase
	default_member_permissions: String(PermissionsBitField.Flags.ManageGuild),
	options: [
		{
			name: "prize",
			...getLocalizedDesc("general/giveaway:PRIZE"),
			type: ApplicationCommandOptionType.String,
			required: true,
			// eslint-disable-next-line camelcase
			max_length: MAX_PRIZE,
		},
		{
			name: "duration",
			...getLocalizedDesc("general/giveaway:DURATION"),
			type: ApplicationCommandOptionType.String,
			required: true,
		},
		{
			name: "winners",
			...getLocalizedDesc("general/giveaway:WINNERS_OPTION"),
			type: ApplicationCommandOptionType.Integer,
			// eslint-disable-next-line camelcase
			min_value: 1,
			// eslint-disable-next-line camelcase
			max_value: MAX_WINNERS,
		},
		{
			name: "credits",
			...getLocalizedDesc("general/giveaway:CREDITS_OPTION"),
			type: ApplicationCommandOptionType.Integer,
			// eslint-disable-next-line camelcase
			min_value: 1,
		},
		{
			name: "item",
			...getLocalizedDesc("general/giveaway:ITEM_OPTION"),
			type: ApplicationCommandOptionType.String,
			autocomplete: true,
		},
		{
			name: "level",
			...getLocalizedDesc("general/giveaway:LEVEL_OPTION"),
			type: ApplicationCommandOptionType.Integer,
			// eslint-disable-next-line camelcase
			min_value: 1,
		},
		{
			name: "role",
			...getLocalizedDesc("general/giveaway:ROLE_OPTION"),
			type: ApplicationCommandOptionType.Role,
		},
		{
			name: "channel",
			...getLocalizedDesc("general/giveaway:CHANNEL_OPTION"),
			type: ApplicationCommandOptionType.Channel,
			// eslint-disable-next-line camelcase
			channel_types: [ChannelType.GuildText, ChannelType.GuildAnnouncement],
		},
	],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply({ flags: MessageFlags.Ephemeral });

	const guild = interaction.guild!;
	const picked = interaction.options.getChannel("channel");
	const channel = picked ? guild.channels.cache.get(picked.id) : interaction.channel;
	if (!channel?.isSendable()) return editReplyError(interaction, "general/giveaway:ERRORS:CHANNEL");

	const input = {
		prize: interaction.options.getString("prize", true),
		duration: parseDuration(interaction.options.getString("duration", true)) ?? NaN,
		winners: interaction.options.getInteger("winners") ?? 1,
		credits: interaction.options.getInteger("credits") ?? 0,
		itemId: interaction.options.getString("item"),
		requiredLevel: interaction.options.getInteger("level") ?? 0,
		requiredRoleId: interaction.options.getRole("role")?.id ?? null,
	};

	const error = await validateGiveaway(guild, input);
	if (error) return editReplyError(interaction, `general/giveaway:ERRORS:${error}`);

	const { url } = await createGiveaway(guild, { ...input, channel, hostId: interaction.user.id }).catch(() => ({
		url: null,
	}));
	if (!url) return editReplyError(interaction, "general/giveaway:ERRORS:CHANNEL");

	await editReplySuccess(interaction, "general/giveaway:STARTED", { url });
};

export const autocompleteRun = async ({ interaction }: AutocompleteProps) => {
	const query = interaction.options.getFocused().toLowerCase();
	const items = await getShopItems(interaction.guildId!);

	await interaction.respond(
		items
			.filter(item => item.name.toLowerCase().includes(query))
			.slice(0, 25)
			.map(item => ({ name: shortenString(itemLabel(item), 100), value: item._id.toString() })),
	);
};
