import {
	asyncForEach,
	formatString,
	getUsername,
	replySuccess,
	translateContext,
} from "@/helpers/functions.js";
import logger from "@/helpers/logger.js";
import { createEmbed } from "@/utils/create-embed.js";
import {
	BaseInteraction,
	ChannelType,
	ThreadAutoArchiveDuration,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	MessageFlags,
	PermissionsBitField,
	ThreadChannel,
} from "discord.js";

export const data = {
	name: "interactionCreate",
	once: false,
};

export async function run(interaction: BaseInteraction) {
	if (!interaction.guild) return;
	if (!interaction.isButton()) return;
	if (!interaction.customId.includes("tickets_")) return;
	if (!interaction.channel?.isTextBased()) return;
	if (interaction.channel.isDMBased()) return;

	switch (interaction.customId) {
		case "tickets_create": {
			if (
				interaction.channel.type !== ChannelType.GuildText &&
				interaction.channel.type !== ChannelType.GuildAnnouncement
			) {
				return;
			}

			// Modal stuff
			const modalSubject = new TextInputBuilder()
				.setCustomId("tickets_modal_subject")
				.setLabel(
					await translateContext(interaction, "tickets/ticketsembed:MODAL_SUBJECT_TITLE"),
				)
				.setStyle(TextInputStyle.Short)
				.setRequired(true)
				.setMinLength(3)
				.setMaxLength(100);
			const modalInput = new TextInputBuilder()
				.setCustomId("tickets_modal_input")
				.setLabel(
					await translateContext(interaction, "tickets/ticketsembed:MODAL_INPUT_TITLE"),
				)
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

			// Handle modal submit
			try {
				const submitted = await interaction.awaitModalSubmit({
					time: 60_000 * 2, // 2 mins
					filter: i =>
						i.user.id === interaction.user.id && i.customId === "tickets_modal",
				});

				const subject = submitted.fields.getTextInputValue("tickets_modal_subject");
				const desc = submitted.fields.getTextInputValue("tickets_modal_input");

				submitted.reply({
					content: await translateContext(
						interaction,
						"tickets/ticketsembed:SUCCESS_TICKET",
					),
					flags: MessageFlags.Ephemeral,
				});

				// Thread stuff
				const name = formatString(`${getUsername(interaction.user)}: ${subject}`, 100);
				const thread = await interaction.channel.threads.create({
					name,
					autoArchiveDuration: ThreadAutoArchiveDuration.ThreeDays,
					// @ts-ignore: type is not undefined only
					type: ChannelType.PrivateThread,
				});

				await thread.members.add(interaction.user.id);
				await thread.members.add("@me");

				// not sure about this...
				const moders = Array.from(
					interaction.guild.members.cache
						.filter(m => m.permissions.has([PermissionsBitField.Flags.ModerateMembers]))
						.values(),
				);

				asyncForEach(moders, async m => {
					await thread.members.add(m.user.id);
				});

				const ticketsEmbed = createEmbed({
					description: await translateContext(
						interaction,
						"tickets/ticketsembed:TICKET_DESC",
						{
							user: interaction.user.toString(),
							time: Math.floor(Date.now() / 1_000),
							text: desc,
						},
					),
				});

				const ticketEmbedsButtons = [
					new ButtonBuilder()
						.setCustomId("tickets_adduser")
						.setStyle(ButtonStyle.Primary)
						.setLabel(
							await translateContext(interaction, "tickets/ticketsembed:ADD_USER"),
						),
					new ButtonBuilder()
						.setCustomId("tickets_closeticket")
						.setStyle(ButtonStyle.Danger)
						.setLabel(
							await translateContext(
								interaction,
								"tickets/ticketsembed:CLOSE_TICKET",
							),
						),
				];

				const ticketsEmbedRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
					ticketEmbedsButtons,
				);

				await thread.send({
					embeds: [ticketsEmbed],
					components: [ticketsEmbedRow],
				});
			} catch (e) {
				logger.error(e);
			}

			break;
		}

		case "tickets_adduser": {
			await interaction.reply({
				content: await translateContext(interaction, "tickets/ticketsembed:ADD_USER_RES"),
				flags: MessageFlags.Ephemeral,
			});

			break;
		}

		case "tickets_closeticket": {
			const closeButtons = [
				new ButtonBuilder()
					.setCustomId("tickets_close_yes")
					.setStyle(ButtonStyle.Success)
					.setLabel(await translateContext(interaction, "common:YES")),
				new ButtonBuilder()
					.setCustomId("tickets_close_no")
					.setStyle(ButtonStyle.Danger)
					.setLabel(await translateContext(interaction, "common:NO")),
			];

			const row = new ActionRowBuilder<ButtonBuilder>().addComponents(closeButtons);

			await interaction.deferUpdate();

			const msg = await interaction.channel.send({
				content: await translateContext(
					interaction,
					"tickets/ticketsembed:CLOSE_TICKET_CONFIRM",
				),
				components: [row],
			});

			try {
				const button = await msg.awaitMessageComponent({
					time: 60_000, // 1 min
					filter: i =>
						i.user.id === interaction.user.id && i.customId.includes("tickets_close_"),
				});
				const channel = button.channel as ThreadChannel;

				switch (button.customId) {
					case "tickets_close_yes": {
						await channel.setLocked(true);
						await replySuccess(button, "tickets/ticketsembed:CLOSE_DONE");

						break;
					}

					case "tickets_close_no": {
						await button.deferUpdate();
						if (msg.deletable) await msg.delete();

						break;
					}
				}
			} catch (e) {
				logger.error(e);
			}

			break;
		}
	}
}
