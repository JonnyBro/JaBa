import { COLORS, formatUser, postModLog, timestamp } from "@/helpers/modlog.js";
import { GuildMember } from "discord.js";

export const data = {
	name: "guildMemberAdd",
	once: false,
};

export async function run(member: GuildMember) {
	await postModLog(member.guild, "memberJoin", { color: COLORS.green }, async t => [
		`**📥 ${await t("MEMBER_JOINED", { user: formatUser(member) })}**`,
		await t("ACCOUNT_CREATED", { date: timestamp(member.user.createdTimestamp, "R") }),
		`-# ${await t("MEMBER_COUNT", { count: member.guild.memberCount })} · ID: ${member.id}`,
	]);
}
