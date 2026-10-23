import { model, Schema } from "mongoose";

export interface IDashboardSessionSchema {
	_id: string;
	data: Record<string, unknown>;
	expiresAt: Date;
}

const dashboardSessionSchema = new Schema<IDashboardSessionSchema>({
	_id: { type: String, required: true },
	data: { type: Schema.Types.Mixed, required: true },
	expiresAt: { type: Date, required: true },
});

// Mongo removes expired sessions on its own
dashboardSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default model<IDashboardSessionSchema>("DashboardSession", dashboardSessionSchema);
