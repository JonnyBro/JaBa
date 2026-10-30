import { asyncForEach, getUsername, shortenString, translateContext } from "@/helpers/functions.js";
import logger from "@/helpers/logger.js";
import { canCloseTicket, closeTicket, getTicket, isTicketStaff } from "@/helpers/tickets.js";
import TicketModel from "@/models/TicketModel.js";
import { createContainer, createSeparator, createText } from "@/utils/create-container.js";
import {
	ActionRowBuilder,
	BaseInteraction,
	ButtonBuilder,
	ButtonStyle,
	ChannelType,
	GuildMember,
	MessageFlags,
	ModalBuilder,
	PermissionsBitField,
	TextInputBuilder,
	TextInputStyle,
	ThreadAutoArchiveDuration,
	UserSelectMenuBuilder,
} from "discord.js";

const ADD_USER_SELECT_ID = "tickets_adduser_select";

export const data = {
	name: "interactionCreate",
	once: false,
};

export async function run(interaction: BaseInteraction) {
	if (!interaction.guild) return;

	if (interaction.isUserSelectMenu() && interaction.customId === ADD_USER_SELECT_ID) {
		const ticket = await getTicket(interaction.channel);
		if (!ticket) return;

		const added: string[] = [];
		const failed: string[] = [];
		for (const user of interaction.users.values()) {
			const ok = !user.bot && (await ticket.thread.members.add(user.id).catch(() => null));
			(ok ? added : failed).push(user.toString());
		}

		const lines = [
			added.length &&
				(await translateContext(interaction, "tickets/ticket:ADD_DONE", { user: added.join(", ") })),
			failed.length &&
				(await translateContext(interaction, "tickets/ticket:ADD_FAILED", { user: failed.join(", ") })),
		];

		await interaction.update({ content: lines.filter(Boolean).join("\n"), components: [] });

		return;
	}

	if (!interaction.isButton()) return;
	if (!interaction.customId.includes("tickets_")) return;
	if (!interaction.channel?.isTextBased()) return;
	if (interaction.channel.isDMBased()) return;

	switch (interaction.customId) {
		case "tickets_create": {
			if (
				interaction.channel.type !== ChannelType.GuildText &&
				interaction.channel.type !== ChannelType.GuildAnnouncement
			)
				return;

			const modalSubject = new TextInputBuilder()
				.setCustomId("tickets_modal_subject")
				.setLabel(await translateContext(interaction, "tickets/ticketsembed:MODAL_SUBJECT_TITLE"))
				.setStyle(TextInputStyle.Short)
				.setRequired(true)
				.setMinLength(3)
				.setMaxLength(100);
			const modalInput = new TextInputBuilder()
				.setCustomId("tickets_modal_input")
				.setLabel(await translateContext(interaction, "tickets/ticketsembed:MODAL_INPUT_TITLE"))
				.setStyle(TextInputStyle.Paragraph)
				.setRequired(true)
				.setMinLength(3)
				.setMaxLength(500);

			const modalRow1 = new ActionRowBuilder<TextInputBuilder>().addComponents(modalSubject);
			const modalRow2 = new ActionRowBuilder<TextInputBuilder>().addComponents(modalInput);

			const modal = new ModalBuilder()
				.setCustomId("tickets_modal")
				.setTitle(await translateContext(interaction, "tickets/ticketsembed:MODAL_TITLE"))
				.addComponents(modalRow1, modalRow2);

			await interaction.showModal(modal);

			try {
				const submitted = await interaction.awaitModalSubmit({
					time: 60_000 * 2, // 2 mins
					filter: i => i.user.id === interaction.user.id && i.customId === "tickets_modal",
				});

				const subject = submitted.fields.getTextInputValue("tickets_modal_subject");
				const desc = submitted.fields.getTextInputValue("tickets_modal_input");

				submitted.reply({
					content: await translateContext(interaction, "tickets/ticketsembed:SUCCESS_TICKET"),
					flags: MessageFlags.Ephemeral,
				});

				const name = shortenString(`${getUsername(interaction.user)}: ${subject}`, 100);
				const thread = await interaction.channel.threads.create({
					name,
					autoArchiveDuration: ThreadAutoArchiveDuration.ThreeDays,
					// @ts-ignore: bug in the discord.js types
					type: ChannelType.PrivateThread,
				});

				await TicketModel.create({
					guildId: interaction.guild.id,
					threadId: thread.id,
					authorId: interaction.user.id,
					subject,
				});

				await thread.members.add(interaction.user.id);
				await thread.members.add("@me");

				// FIXME: not sure about this...
				const moders = Array.from(
					interaction.guild.members.cache
						.filter(m => m.permissions.has([PermissionsBitField.Flags.ModerateMembers]))
						.values(),
				);

				asyncForEach(moders, async m => {
					await thread.members.add(m.user.id);
				});

				const ticketEmbedsButtons = [
					new ButtonBuilder()
						.setCustomId("tickets_adduser")
						.setStyle(ButtonStyle.Primary)
						.setLabel(await translateContext(interaction, "tickets/ticketsembed:ADD_USER")),
					new ButtonBuilder()
						.setCustomId("tickets_closeticket")
						.setStyle(ButtonStyle.Danger)
						.setLabel(await translateContext(interaction, "tickets/ticketsembed:CLOSE_TICKET")),
				];

				const author = await translateContext(interaction, "tickets/ticketsembed:TICKET_AUTHOR", {
					user: interaction.user.toString(),
					time: Math.floor(Date.now() / 1_000),
				});

				const container = createContainer()
					.addTextDisplayComponents(createText(`## ${subject}\n-# ${author}`))
					.addSeparatorComponents(createSeparator())
					.addTextDisplayComponents(createText(`>>> ${desc}`))
					.addSeparatorComponents(createSeparator(false))
					.addActionRowComponents(new ActionRowBuilder<ButtonBuilder>().addComponents(ticketEmbedsButtons));

				// Unlike embeds, mentions inside text displays do ping
				await thread.send({
					flags: MessageFlags.IsComponentsV2,
					components: [container],
					allowedMentions: { parse: [] },
				});
			} catch (e) {
				logger.error(e);
			}

			break;
		}

		case "tickets_adduser": {
			const ticket = await getTicket(interaction.channel);
			const member = interaction.member as GuildMember;
			if (!ticket) return;

			if (!isTicketStaff(member) && member.id !== ticket.authorId) {
				await interaction.reply({
					content: await translateContext(interaction, "tickets/ticket:NO_PERMISSION"),
					flags: MessageFlags.Ephemeral,
				});
				break;
			}

			await interaction.reply({
				content: await translateContext(interaction, "tickets/ticketsembed:ADD_USER_RES"),
				components: [
					new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
						new UserSelectMenuBuilder().setCustomId(ADD_USER_SELECT_ID).setMinValues(1).setMaxValues(5),
					),
				],
				flags: MessageFlags.Ephemeral,
			});

			break;
		}

		case "tickets_closeticket": {
			const ticket = await getTicket(interaction.channel);
			if (!ticket) return;

			if (!canCloseTicket(interaction.member as GuildMember, ticket)) {
				await interaction.reply({
					content: await translateContext(interaction, "tickets/ticket:NO_PERMISSION"),
					flags: MessageFlags.Ephemeral,
				});
				break;
			}

			const confirm = await interaction.reply({
				content: await translateContext(interaction, "tickets/ticketsembed:CLOSE_TICKET_CONFIRM"),
				components: [
					new ActionRowBuilder<ButtonBuilder>().addComponents(
						new ButtonBuilder()
							.setCustomId("tickets_close_yes")
							.setStyle(ButtonStyle.Danger)
							.setLabel(await translateContext(interaction, "common:YES")),
						new ButtonBuilder()
							.setCustomId("tickets_close_no")
							.setStyle(ButtonStyle.Secondary)
							.setLabel(await translateContext(interaction, "common:NO")),
					),
				],
				flags: MessageFlags.Ephemeral,
				withResponse: true,
			});

			const button = await confirm.resource?.message
				?.awaitMessageComponent({ time: 60_000, filter: i => i.user.id === interaction.user.id })
				.catch(() => null);

			if (button?.customId !== "tickets_close_yes") {
				await interaction.deleteReply().catch(() => {});
				break;
			}

			await button.update({
				content: await translateContext(interaction, "tickets/ticket:CLOSE_DONE"),
				components: [],
			});
			await closeTicket(ticket.thread, interaction.user);

			break;
		}
	}
}
