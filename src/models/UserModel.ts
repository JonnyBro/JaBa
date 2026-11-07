import { Schema, model } from "mongoose";

export type UserReminds = {
	message: string;
	createdAt: number;
	sendAt: number;
	/** Link to the message the reminder was made from */
	url?: string | null;
};

export interface IUserSchema {
	id: string;
	rep: number;
	bio: string | null;
	birthdate: number | null;
	/** Hides the birth year in the profile and the age in the birthday greeting */
	hideAge: boolean;
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
		url: { type: String, default: null },
	},
	{ _id: false },
);

const userSchema = new Schema<IUserSchema>({
	id: { type: String, required: true },
	rep: { type: Number, default: 0 },
	bio: { type: String, default: null },
	birthdate: { type: Number, default: null },
	hideAge: { type: Boolean, default: false },
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
