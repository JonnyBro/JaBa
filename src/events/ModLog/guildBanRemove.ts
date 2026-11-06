import { COLORS, findAuditEntry, formatUser, postModLog } from "@/helpers/modlog.js";
import { AuditLogEvent, GuildBan } from "discord.js";

export const data = {
	name: "guildBanRemove",
	once: false,
};

export async function run(ban: GuildBan) {
	await postModLog(ban.guild, "unban", { color: COLORS.green }, async t => {
		const entry = await findAuditEntry(ban.guild, AuditLogEvent.MemberBanRemove, ban.user.id);

		return [
			`**🕊️ ${await t("UNBANNED", { user: formatUser(ban.user) })}**`,
			entry && (await t("BY", { user: formatUser(entry.executor, entry.executorId) })),
			entry?.reason && (await t("REASON", { reason: entry.reason })),
			`-# ID: ${ban.user.id}`,
		];
	});
}
