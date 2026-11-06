import { COLORS, formatUser, postModLog } from "@/helpers/modlog.js";
import { AuditLogEvent, Guild, GuildAuditLogsEntry } from "discord.js";

export const data = {
	name: "guildAuditLogEntryCreate",
	once: false,
};

// Kicks look like a normal leave in guildMemberRemove, only the audit log tells them apart
export async function run(entry: GuildAuditLogsEntry, guild: Guild) {
	if (entry.action !== AuditLogEvent.MemberKick || !entry.targetId) return;

	const target = await guild.client.users.fetch(entry.targetId).catch(() => null);

	await postModLog(guild, "kick", { color: COLORS.orange }, async t => [
		`**👢 ${await t("KICKED", { user: formatUser(target, entry.targetId) })}**`,
		await t("BY", { user: formatUser(entry.executor, entry.executorId) }),
		entry.reason && (await t("REASON", { reason: entry.reason })),
		`-# ID: ${entry.targetId}`,
	]);
}
