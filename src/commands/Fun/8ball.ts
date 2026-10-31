import { getLocalizedDesc, randomNum, shortenString, translateContext } from "@/helpers/functions.js";
import { CommandData, SlashCommandProps } from "@/types.js";
import { containerMessage, createContainer, createText } from "@/utils/create-container.js";
import {
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	InteractionContextType,
	MessageFlags,
} from "discord.js";

export const data: CommandData = {
	name: "8ball",
	...getLocalizedDesc("fun/8ball:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall],
	contexts: [InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel],
	options: [
		{
			name: "question",
			type: ApplicationCommandOptionType.String,
			...getLocalizedDesc("fun/8ball:QUESTION"),
			required: true,
		},
		{
			name: "ephemeral",
			type: ApplicationCommandOptionType.Boolean,
			...getLocalizedDesc("misc:EPHEMERAL_RESPONSE"),
		},
	],
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply({
		flags: interaction.options.getBoolean("ephemeral") ? MessageFlags.Ephemeral : undefined,
	});

	const question = shortenString(interaction.options.getString("question", true), 200);
	const answer = await translateContext(interaction, `fun/8ball:RESPONSE_${randomNum(1, 20)}`);

	const container = createContainer().addTextDisplayComponents(
		createText(`-# ${await translateContext(interaction, "fun/8ball:QUESTION")}\n${question}`),
		createText(`-# ${await translateContext(interaction, "fun/8ball:ANSWER")}\n### 🎱 ${answer}`),
	);

	setTimeout(() => {
		interaction.editReply(containerMessage(container));
	}, 2500);
};
