import { model, Schema } from "mongoose";

export interface IBotSettingsSchema {
	key: string;
	maintenance: { enabled: boolean; message: string | null };
	status: string | null;
}

const botSettingsSchema = new Schema<IBotSettingsSchema>({
	key: { type: String, required: true, unique: true },
	maintenance: {
		enabled: { type: Boolean, default: false },
		message: { type: String, default: null },
	},
	status: { type: String, default: null },
});

export default model<IBotSettingsSchema>("BotSettings", botSettingsSchema);
