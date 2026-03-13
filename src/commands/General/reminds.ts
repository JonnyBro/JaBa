import { getLocalizedDesc, translateContext } from "@/helpers/functions.js";
import { UserReminds } from "@/models/UserModel.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import { componentRouter } from "@/utils/component-router.js";
import useClient from "@/utils/use-client.js";
import {
	ApplicationIntegrationType,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	ChatInputCommandInteraction,
	ContainerBuilder,
	InteractionContextType,
	MessageFlags,
	SectionBuilder,
	SeparatorBuilder,
	SeparatorSpacingSize,
	TextDisplayBuilder,
} from "discord.js";

const client = useClient();

export const data: CommandData = {
	name: "reminds",
	...getLocalizedDesc("general/reminds:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall],
	contexts: [InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel],
	options: [],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply({ flags: MessageFlags.Ephemeral });

	const userData = await client.getUserData(interaction.user.id);
	const container = await buildContainer(interaction, userData.reminds);

	await interaction.editReply({
		components: [container],
		flags: MessageFlags.IsComponentsV2,
	});
};

componentRouter.register("REMIND_DELETE", async interaction => {
	if (!interaction.isButton()) return;

	const index = Number(interaction.customId.split(":")[1]);
	const userData = await client.getUserData(interaction.user.id);

	userData.reminds.splice(index, 1);

	await userData.save();

	const container = await buildContainer(interaction, userData.reminds);

	await interaction.update({
		components: [container],
		flags: MessageFlags.IsComponentsV2,
	});

	await interaction.followUp({
		content: await translateContext(interaction, "general/reminds:DELETED", {
			pos: index + 1,
		}),
		flags: MessageFlags.Ephemeral,
	});
});

const buildContainer = async (interaction: ChatInputCommandInteraction | ButtonInteraction, reminds: UserReminds[]) => {
	const container = new ContainerBuilder();

	if (!reminds.length) {
		container.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(await translateContext(interaction, "general/reminds:NO_REMINDS")),
		);

		return container;
	}

	for (const [index, r] of reminds.entries()) {
		const message = `${await translateContext(interaction, "common:MESSAGE")}: ${r.message}`;
		const createdAt = `${await translateContext(interaction, "general/remindme:EMBED_TIME")}: <t:${r.createdAt}:f>`;
		const sendAt = `${await translateContext(interaction, "general/remindme:EMBED_CREATED")}: <t:${r.sendAt}:f>`;

		const section = new SectionBuilder()
			.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(`### Remind #${index + 1}\n${message}\n${createdAt}\n${sendAt}`),
			)
			.setButtonAccessory(
				new ButtonBuilder()
					.setCustomId(`REMIND_DELETE:${index}`)
					.setLabel(await translateContext(interaction, "general/reminds:DELETE"))
					.setStyle(ButtonStyle.Danger),
			);

		container.addSectionComponents(section);
		container.addSeparatorComponents(
			new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
		);
	}

	return container;
};
