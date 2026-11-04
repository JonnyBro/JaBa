import { giveAutoroles, sendGreeting } from "@/helpers/greetings.js";
import { GuildMember } from "discord.js";

export const data = {
	name: "guildMemberAdd",
	once: false,
};

export async function run(member: GuildMember) {
	if (member.user.bot) return;

	await Promise.all([sendGreeting(member, "welcome"), sendGreeting(member, "dm")]);

	// Roles can't be given before the member accepts the server rules, guildMemberUpdate handles that
	if (!member.pending) await giveAutoroles(member);
}
