import { replyError } from "@/helpers/functions.js";
import { BuiltInValidationParams } from "@/types.js";
import { ChannelType } from "discord.js";

export default function ({ interaction, targetCommand, client }: BuiltInValidationParams) {
	if (interaction.isAutocomplete()) return;

	const devGuildsIds = client.configService.get<string[]>("devGuildsIds");

	if (!targetCommand.options?.devOnly) return;
	if (!interaction.isRepliable()) return;

	if (interaction.channel?.type === ChannelType.DM) {
		replyError(interaction, "This command is only available in development servers", null, {
			ephemeral: true,
		});

		return true;
	}

	if (interaction.inGuild() && !devGuildsIds.includes(interaction.guildId)) {
		replyError(interaction, "This command is only available in development servers", null, {
			ephemeral: true,
		});

		return true;
	}

	if (interaction.user.id !== client.configService.get<string>("owner.id")) {
		replyError(interaction, "This command is only available by the developer", null, {
			ephemeral: true,
		});

		return true;
	}
}
