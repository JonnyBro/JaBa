import { COLORS, formatUser, postModLog, timestamp } from "@/helpers/modlog.js";
import { GuildMember, PartialGuildMember } from "discord.js";

export const data = {
	name: "guildMemberRemove",
	once: false,
};

export async function run(member: GuildMember | PartialGuildMember) {
	const roles = member.partial ? [] : member.roles.cache.filter(role => role.id !== member.guild.id).map(String);

	await postModLog(member.guild, "memberLeave", { color: COLORS.gray }, async t => [
		`**📤 ${await t("MEMBER_LEFT", { user: formatUser(member.user) })}**`,
		!!member.joinedTimestamp && (await t("JOINED_AT", { date: timestamp(member.joinedTimestamp, "R") })),
		roles.length > 0 && (await t("ROLES", { roles: roles.join(" ") })),
		`-# ${await t("MEMBER_COUNT", { count: member.guild.memberCount })} · ID: ${member.id}`,
	]);
}
