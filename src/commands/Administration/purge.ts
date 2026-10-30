import { editReplyError, editReplySuccess, getLocalizedDesc } from "@/helpers/functions.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import {
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	InteractionContextType,
	Message,
	MessageFlags,
	PermissionsBitField,
} from "discord.js";

const MAX_AMOUNT = 100;
const MAX_PAGES = 5;
// Discord refuses to bulk delete older messages, the margin keeps a slow request from crossing the line
const BULK_DELETE_AGE = 14 * 24 * 60 * 60 * 1000 - 60 * 1000;

export const data: CommandData = {
	name: "purge",
	...getLocalizedDesc("administration/purge:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	// eslint-disable-next-line camelcase
	default_member_permissions: String(PermissionsBitField.Flags.ManageMessages),
	options: [
		{
			name: "amount",
			...getLocalizedDesc("administration/purge:AMOUNT"),
			type: ApplicationCommandOptionType.Integer,
			required: true,
			// eslint-disable-next-line camelcase
			min_value: 1,
			// eslint-disable-next-line camelcase
			max_value: MAX_AMOUNT,
		},
		{
			name: "user",
			...getLocalizedDesc("administration/purge:USER"),
			type: ApplicationCommandOptionType.User,
		},
		{
			name: "bots",
			...getLocalizedDesc("administration/purge:BOTS"),
			type: ApplicationCommandOptionType.Boolean,
		},
	],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply({ flags: MessageFlags.Ephemeral });

	const channel = interaction.channel;
	if (!channel || channel.isDMBased() || !channel.isTextBased())
		return editReplyError(interaction, "misc:UNKNOWN_ERROR");

	const botPermissions = channel.permissionsFor(interaction.guild!.members.me!);
	if (!botPermissions?.has([PermissionsBitField.Flags.ManageMessages, PermissionsBitField.Flags.ReadMessageHistory]))
		return editReplyError(interaction, "misc:NO_BOT_PERMS");

	const amount = interaction.options.getInteger("amount", true);
	const user = interaction.options.getUser("user");
	const botsOnly = interaction.options.getBoolean("bots") ?? false;
	const cutoff = Date.now() - BULK_DELETE_AGE;

	const matches = (message: Message) =>
		!message.pinned && (!user || message.author.id === user.id) && (!botsOnly || message.author.bot);

	const toDelete: Message[] = [];
	let before: string | undefined;
	let reachedOld = false;

	// Without filters the first page is enough, with them older pages are searched for more matches
	for (let page = 0; page < MAX_PAGES && toDelete.length < amount && !reachedOld; page++) {
		const messages = await channel.messages.fetch({ limit: 100, before });
		if (!messages.size) break;

		for (const message of messages.values()) {
			if (message.createdTimestamp < cutoff) {
				reachedOld = true;
				break;
			}

			if (matches(message)) toDelete.push(message);
			if (toDelete.length === amount) break;
		}

		before = messages.last()!.id;
	}

	if (!toDelete.length) return editReplyError(interaction, "administration/purge:NOTHING");

	const deleted = await channel.bulkDelete(toDelete, true);

	await editReplySuccess(
		interaction,
		deleted.size < amount ? "administration/purge:PARTIAL" : "administration/purge:SUCCESS",
		{ count: deleted.size, amount },
	);
};
