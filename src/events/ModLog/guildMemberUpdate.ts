import { COLORS, findAuditEntry, formatUser, postModLog, timestamp, Translate } from "@/helpers/modlog.js";
import { AuditLogEvent, GuildMember, PartialGuildMember } from "discord.js";

export const data = {
	name: "guildMemberUpdate",
	once: false,
};

const executorLine = async (t: Translate, member: GuildMember, type: AuditLogEvent) => {
	const entry = await findAuditEntry(member.guild, type, member.id);

	return entry && (await t("BY", { user: formatUser(entry.executor, entry.executorId) }));
};

// Without the old state there is nothing to compare, so uncached members are skipped
export async function run(oldMember: GuildMember | PartialGuildMember, member: GuildMember) {
	if (oldMember.partial) return;

	const guild = member.guild;
	const user = formatUser(member);
	const tasks: Promise<void>[] = [];

	if (oldMember.nickname !== member.nickname)
		tasks.push(
			postModLog(guild, "nickname", { color: COLORS.blue }, async t => {
				const none = await t("NO_NICKNAME");

				return [
					`**🏷️ ${await t("NICKNAME", { user })}**`,
					`${oldMember.nickname ?? none} → ${member.nickname ?? none}`,
					await executorLine(t, member, AuditLogEvent.MemberUpdate),
					`-# ID: ${member.id}`,
				];
			}),
		);

	const added = member.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
	const removed = oldMember.roles.cache.filter(role => !member.roles.cache.has(role.id));
	if (added.size || removed.size)
		tasks.push(
			postModLog(guild, "roles", { color: COLORS.blue }, async t => [
				`**🎭 ${await t("ROLES_CHANGED", { user })}**`,
				added.size > 0 && `➕ ${added.map(String).join(" ")}`,
				removed.size > 0 && `➖ ${removed.map(String).join(" ")}`,
				await executorLine(t, member, AuditLogEvent.MemberRoleUpdate),
				`-# ID: ${member.id}`,
			]),
		);

	const before = oldMember.communicationDisabledUntilTimestamp ?? 0;
	const after = member.communicationDisabledUntilTimestamp ?? 0;
	if (before !== after && (before > Date.now() || after > Date.now()))
		tasks.push(
			postModLog(guild, "timeout", { color: after > Date.now() ? COLORS.orange : COLORS.green }, async t => {
				const entry = await findAuditEntry(guild, AuditLogEvent.MemberUpdate, member.id);

				let title = `**🔊 ${await t("TIMEOUT_REMOVED", { user })}**`;
				if (after > Date.now()) title = `**🔇 ${await t("TIMED_OUT", { user, date: timestamp(after, "R") })}**`;

				return [
					title,
					entry && (await t("BY", { user: formatUser(entry.executor, entry.executorId) })),
					entry?.reason && (await t("REASON", { reason: entry.reason })),
					`-# ID: ${member.id}`,
				];
			}),
		);

	await Promise.all(tasks);
}
