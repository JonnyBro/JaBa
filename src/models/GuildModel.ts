import { model, Schema, Types } from "mongoose";
import useClient from "@/utils/use-client.js";

const client = useClient();

export interface GuildReconnectInfo {
	status: boolean;
	text: string | null;
	voice: string | null;
}

export interface IGuildSchema {
	id: string;
	membersData: Record<string, any>;
	members: Types.ObjectId[];
	language: string;
	plugins: any;
	reconnects: GuildReconnectInfo;
}

const GuildSchema = new Schema<IGuildSchema>({
	id: { type: String, required: true },
	membersData: { type: Object, default: {} },
	members: [{ type: Schema.Types.ObjectId, ref: "Member" }],
	language: {
		type: String,
		default: client.configService.get<string>("defaultLang"),
	},
	plugins: {
		type: Object,
		default: {
			welcome: {
				enabled: false,
				message: null,
				channel: null,
				withImage: null,
			},
			goodbye: {
				enabled: false,
				message: null,
				channel: null,
				withImage: null,
			},
			tickets: {
				count: 0,
				ticketLogs: null,
				transcriptionLogs: null,
				ticketsCategory: null,
			},
		},
	},
	reconnects: {
		type: Object,
		default: {
			status: false,
			text: null,
			voice: null,
		},
	},
});

export default model<IGuildSchema>("Guild", GuildSchema);
