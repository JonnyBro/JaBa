import { handleHoneypotMessage } from "@/helpers/honeypot.js";
import { Message } from "discord.js";

export const data = {
	name: "messageCreate",
	once: false,
};

export async function run(message: Message) {
	if (!message.inGuild() || message.author.bot || message.system) return;

	await handleHoneypotMessage(message);
}
