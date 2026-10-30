import { editReplyError, editReplySuccess, getLocalizedDesc } from "@/helpers/functions.js";
import { canCloseTicket, closeTicket, getTicket, isTicketStaff, reopenTicket } from "@/helpers/tickets.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import useClient from "@/utils/use-client.js";
import {
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	GuildMember,
	InteractionContextType,
	MessageFlags,
} from "discord.js";

const client = useClient();
const MAX_REASON = 500;

const userOption = {
	name: "user",
	...getLocalizedDesc("common:USER"),
	type: ApplicationCommandOptionType.User as const,
	required: true,
};

export const data: CommandData = {
	name: "ticket",
	...getLocalizedDesc("tickets/ticket:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall],
	contexts: [InteractionContextType.Guild],
	options: [
		{
			name: "close",
			...getLocalizedDesc("tickets/ticket:CLOSE"),
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "reason",
					...getLocalizedDesc("tickets/ticket:REASON"),
					type: ApplicationCommandOptionType.String,
					// eslint-disable-next-line camelcase
					max_length: MAX_REASON,
				},
			],
		},
		{
			name: "reopen",
			...getLocalizedDesc("tickets/ticket:REOPEN"),
			type: ApplicationCommandOptionType.Subcommand,
		},
		{
			name: "add",
			...getLocalizedDesc("tickets/ticket:ADD"),
			type: ApplicationCommandOptionType.Subcommand,
			options: [userOption],
		},
		{
			name: "remove",
			...getLocalizedDesc("tickets/ticket:REMOVE"),
			type: ApplicationCommandOptionType.Subcommand,
			options: [userOption],
		},
	],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply({ flags: MessageFlags.Ephemeral });

	const ticket = await getTicket(interaction.channel);
	if (!ticket) return editReplyError(interaction, "tickets/ticket:NOT_A_TICKET");

	const member = interaction.member as GuildMember;
	const { thread } = ticket;

	switch (interaction.options.getSubcommand()) {
		case "close": {
			if (!canCloseTicket(member, ticket)) return editReplyError(interaction, "tickets/ticket:NO_PERMISSION");
			if (thread.locked) return editReplyError(interaction, "tickets/ticket:ALREADY_CLOSED");

			// The reply has to go out before the thread is archived, it can't be edited afterwards
			await editReplySuccess(interaction, "tickets/ticket:CLOSE_DONE");
			await closeTicket(thread, interaction.user, interaction.options.getString("reason"));

			return;
		}

		case "reopen": {
			if (!isTicketStaff(member)) return editReplyError(interaction, "tickets/ticket:STAFF_ONLY");
			if (!thread.locked && !thread.archived) return editReplyError(interaction, "tickets/ticket:NOT_CLOSED");

			await reopenTicket(thread, interaction.user);

			return editReplySuccess(interaction, "tickets/ticket:REOPEN_DONE");
		}

		case "add": {
			if (!isTicketStaff(member) && member.id !== ticket.authorId)
				return editReplyError(interaction, "tickets/ticket:NO_PERMISSION");

			const user = interaction.options.getUser("user", true);
			if (user.bot) return editReplyError(interaction, "misc:BOT_USER");

			// Private thread members must be able to see the parent channel, otherwise Discord refuses to add them
			const added = await thread.members.add(user.id).catch(() => null);
			if (!added) return editReplyError(interaction, "tickets/ticket:ADD_FAILED", { user: user.toString() });

			return editReplySuccess(interaction, "tickets/ticket:ADD_DONE", { user: user.toString() });
		}

		case "remove": {
			if (!isTicketStaff(member)) return editReplyError(interaction, "tickets/ticket:STAFF_ONLY");

			const user = interaction.options.getUser("user", true);
			if (user.id === ticket.authorId || user.id === client.user.id)
				return editReplyError(interaction, "tickets/ticket:CANT_REMOVE");

			await thread.members.remove(user.id).catch(() => null);

			return editReplySuccess(interaction, "tickets/ticket:REMOVE_DONE", { user: user.toString() });
		}
	}
};
