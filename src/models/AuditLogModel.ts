import { model, Schema } from "mongoose";

export interface IAuditLogSchema {
	guildId: string;
	actorId: string;
	actorName: string;
	actorAvatar: string | null;
	action: string;
	targetId: string | null;
	targetName: string | null;
	details: Record<string, unknown>;
	createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLogSchema>(
	{
		guildId: { type: String, required: true },
		actorId: { type: String, required: true },
		actorName: { type: String, required: true },
		actorAvatar: { type: String, default: null },
		action: { type: String, required: true },
		targetId: { type: String, default: null },
		targetName: { type: String, default: null },
		details: { type: Schema.Types.Mixed, default: () => ({}) },
	},
	{ timestamps: { createdAt: true, updatedAt: false } },
);

auditLogSchema.index({ guildId: 1, createdAt: -1 });

export default model<IAuditLogSchema>("AuditLog", auditLogSchema);
