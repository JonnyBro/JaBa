import { getLocalizedDesc } from "@/helpers/extenders.js";
import logger from "@/helpers/logger.js";
import { CommandData, CommandOptions, SlashCommandProps } from "@/types.js";
import { createEmbed } from "@/utils/create-embed.js";
import useClient from "@/utils/use-client.js";
import { ApplicationCommandOptionType, ApplicationIntegrationType, InteractionContextType, MessageFlags } from "discord.js";
import { inspect } from "util";

const client = useClient();

export const data: CommandData = {
	name: "eval",
	...getLocalizedDesc("owner/eval:DESCRIPTION"),
	// eslint-disable-next-line camelcase
	integration_types: [ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall],
	contexts: [InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel],
	options: [
		{
			name: "code",
			type: ApplicationCommandOptionType.String,
			...getLocalizedDesc("owner/eval:CODE"),
			required: true,
		},
	],
};

export const options: CommandOptions = {
	devOnly: true,
};

export const run = async ({ interaction }: SlashCommandProps) => {
	await interaction.deferReply({ flags: MessageFlags.Ephemeral });

	const code = interaction.options.getString("code", true);
	const result = new Promise(resolve => resolve(eval(code)));

	return result
		.then((output: any) => {
			if (typeof output !== "string") output = inspect(output);
			if (output.includes(client.token)) output = output.replace(client.token, "there_be_tokens");

			const embed = createEmbed({
				description: `Code:\n\`\`\`${code}\`\`\`\nOutput:\n\`\`\`ts\n${output}`.slice(0, 4090) + "\n```",
			});

			interaction.editReply({
				embeds: [embed],
			});
		})
		.catch(err => {
			logger.error("[eval]", err);
			err = err.toString();

			if (err.includes(client.token)) err = err.replace(client.token, "there_be_tokens");

			interaction.editReply({
				content: `\`\`\`md\n${err}\n\`\`\``,
			});
		});
};
