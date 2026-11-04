import { sendGreeting } from "@/helpers/greetings.js";
import { GuildMember, PartialGuildMember } from "discord.js";

export const data = {
	name: "guildMemberRemove",
	once: false,
};

export async function run(member: GuildMember | PartialGuildMember) {
	if (member.user.bot) return;

	await sendGreeting(member, "goodbye");
}
