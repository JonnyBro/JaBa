import { BuiltInValidationParams } from "@/types.js";
import { ChannelType } from "discord.js";

export default function ({ interaction, targetCommand, client }: BuiltInValidationParams) {
	if (interaction.isAutocomplete()) return;

	const devGuildsIds = client.configService.get<string[]>("devGuildsIds");

	if (!targetCommand.options?.devOnly) return;

	if (!interaction.isRepliable()) return;

	if (interaction.channel?.type === ChannelType.DM) {
		interaction.reply({
			content: "❌ This command is only available in development servers.",
			ephemeral: true,
		});

		return true;
	}

	if (interaction.inGuild() && !devGuildsIds.includes(interaction.guildId)) {
		interaction.reply({
			content: "❌ This command is only available in development servers.",
			ephemeral: true,
		});

		return true;
	}
}
