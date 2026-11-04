import { giveAutoroles } from "@/helpers/greetings.js";
import { GuildMember, PartialGuildMember } from "discord.js";

export const data = {
	name: "guildMemberUpdate",
	once: false,
};

export async function run(oldMember: GuildMember | PartialGuildMember, member: GuildMember) {
	// Only the moment the rules get accepted, otherwise autoroles an admin took away would come back on any update
	if (member.user.bot || member.pending || oldMember.pending !== true) return;

	await giveAutoroles(member);
}
