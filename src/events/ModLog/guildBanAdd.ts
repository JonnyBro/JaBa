import { COLORS, findAuditEntry, formatUser, postModLog } from "@/helpers/modlog.js";
import { AuditLogEvent, GuildBan } from "discord.js";

export const data = {
	name: "guildBanAdd",
	once: false,
};

export async function run(ban: GuildBan) {
	await postModLog(ban.guild, "ban", { color: COLORS.red }, async t => {
		const entry = await findAuditEntry(ban.guild, AuditLogEvent.MemberBanAdd, ban.user.id);
		const reason = entry?.reason ?? ban.reason;

		return [
			`**🔨 ${await t("BANNED", { user: formatUser(ban.user) })}**`,
			entry && (await t("BY", { user: formatUser(entry.executor, entry.executorId) })),
			reason && (await t("REASON", { reason })),
			`-# ID: ${ban.user.id}`,
		];
	});
}
