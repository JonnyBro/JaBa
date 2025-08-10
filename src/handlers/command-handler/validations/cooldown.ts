import { BuiltInValidationParams } from "@/types.js";

const cooldowns = new Map<string, Map<string, number>>();

export default function ({ targetCommand, interaction }: BuiltInValidationParams) {
	const { cooldown } = targetCommand.options || {};

	if (!cooldown) return;

	const now = Date.now();
	const userId = interaction.user.id;
	const commandName = targetCommand.data.name;

	if (!cooldowns.has(commandName)) {
		cooldowns.set(commandName, new Map());
	}

	const userCooldowns = cooldowns.get(commandName)!;

	if (userCooldowns) {
		const expirationTime = userCooldowns.get(userId)! + cooldown * 1000;
		if (now < expirationTime) {
			const timeLeft = (expirationTime - now) / 1000;

			if (!interaction.isRepliable()) return;

			interaction.reply({
				content: `❌ You can use this command again in ${timeLeft.toFixed(1)} seconds.`,
				ephemeral: true,
			});

			return true;
		}
	}
	userCooldowns.set(userId, now);
	return false;
}
