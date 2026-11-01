import { model, Schema } from "mongoose";

export interface ITempRoleSchema {
	guildId: string;
	userId: string;
	roleId: string;
	expiresAt: Date;
}

const tempRoleSchema = new Schema<ITempRoleSchema>({
	guildId: { type: String, required: true },
	userId: { type: String, required: true },
	roleId: { type: String, required: true },
	expiresAt: { type: Date, required: true },
});

tempRoleSchema.index({ guildId: 1, userId: 1, roleId: 1 }, { unique: true });
tempRoleSchema.index({ expiresAt: 1 });

export default model<ITempRoleSchema>("TempRole", tempRoleSchema);
