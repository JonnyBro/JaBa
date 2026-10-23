import { model, Schema } from "mongoose";

export interface ILavalinkSessionSchema {
	nodeId: string;
	sessionId: string;
}

const lavalinkSessionSchema = new Schema<ILavalinkSessionSchema>({
	nodeId: { type: String, required: true, unique: true },
	sessionId: { type: String, required: true },
});

export default model<ILavalinkSessionSchema>("LavalinkSession", lavalinkSessionSchema);
