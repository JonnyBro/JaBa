import { model, Schema } from "mongoose";

export interface ITicketSchema {
	guildId: string;
	threadId: string;
	authorId: string;
	subject: string;
	closedAt: Date | null;
	closedBy: string | null;
}

const ticketSchema = new Schema<ITicketSchema>(
	{
		guildId: { type: String, required: true },
		threadId: { type: String, required: true, unique: true },
		authorId: { type: String, required: true },
		subject: { type: String, required: true },
		closedAt: { type: Date, default: null },
		closedBy: { type: String, default: null },
	},
	{ timestamps: { createdAt: true, updatedAt: false } },
);

export default model<ITicketSchema>("Ticket", ticketSchema);
