import { model, Schema } from "mongoose";

export interface ICommandUsageSchema {
	day: string;
	command: string;
	count: number;
}

const commandUsageSchema = new Schema<ICommandUsageSchema>({
	day: { type: String, required: true },
	command: { type: String, required: true },
	count: { type: Number, default: 0 },
});

commandUsageSchema.index({ day: 1, command: 1 }, { unique: true });

export default model<ICommandUsageSchema>("CommandUsage", commandUsageSchema);
