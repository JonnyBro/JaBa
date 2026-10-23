import { replyError } from "@/helpers/functions.js";
import { getBotSettings, isBlacklisted } from "@/services/bot-settings/index.js";
import { BuiltInValidationParams } from "@/types.js";

export default function ({ interaction, client }: BuiltInValidationParams) {
	const blocked = isBlacklisted("user", interaction.user.id) || isBlacklisted("guild", interaction.guildId);
	const { maintenance } = getBotSettings();
	const underMaintenance = maintenance.enabled && interaction.user.id !== client.configService.get<string>("OWNER");

	if (!blocked && !underMaintenance) return;
	if (interaction.isAutocomplete()) return true;
	if (!interaction.isRepliable()) return true;

	if (blocked) replyError(interaction, "misc:BLACKLISTED", null, { ephemeral: true });
	else
		replyError(
			interaction,
			maintenance.message ? "misc:MAINTENANCE_MESSAGE" : "misc:MAINTENANCE",
			{ message: maintenance.message },
			{ ephemeral: true },
		);

	return true;
}
