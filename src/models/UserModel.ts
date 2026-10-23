import { Schema, model } from "mongoose";

export type UserReminds = {
	message: string;
	createdAt: number;
	sendAt: number;
};

export interface IUserSchema {
	id: string;
	rep: number;
	bio: string | null;
	birthdate: number | null;
	registeredAt: number;
	cooldowns: {
		rep: number;
	};
	reminds: UserReminds[];
}

const remindsSchema = new Schema(
	{
		message: { type: String, required: true },
		createdAt: { type: Number, required: true },
		sendAt: { type: Number, required: true },
	},
	{ _id: false },
);

const userSchema = new Schema<IUserSchema>({
	id: { type: String, required: true },
	rep: { type: Number, default: 0 },
	bio: { type: String, default: null },
	birthdate: { type: Number, default: null },
	registeredAt: { type: Number, default: () => Date.now() },
	cooldowns: {
		rep: { type: Number, default: 0 },
	},
	reminds: {
		type: [remindsSchema],
		default: [],
	},
});

export default model<IUserSchema>("User", userSchema);
