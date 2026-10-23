import logger from "@/helpers/logger.js";
import AuditLogModel from "@/models/AuditLogModel.js";
import { FastifyRequest } from "fastify";
import { avatarUrl } from "./utils.js";

type AuditEntry = {
	action: string;
	target?: { id: string; name: string } | null;
	details?: Record<string, unknown>;
};

export const logAction = async (req: FastifyRequest, guildId: string, { action, target, details }: AuditEntry) => {
	const user = req.session.user!;

	await AuditLogModel.create({
		guildId,
		actorId: user.id,
		actorName: user.globalName || user.username,
		actorAvatar: avatarUrl(user.id, user.avatar),
		action,
		targetId: target?.id ?? null,
		targetName: target?.name ?? null,
		details: details ?? {},
	}).catch(error => logger.warn(`[Dashboard] Failed to write the audit log of ${guildId}:`, error));
};
