import { Entity, OneToMany, Property } from "@mikro-orm/core";
import { Member } from "./MemberModel.js";
import useClient from "@/utils/use-client.js";
import { BaseEntity } from "./BaseModel.js";

const client = useClient();

export type Plugins = {
	welcome: {
		enabled: boolean;
		message: string | null;
		channel: string | null;
		withImage: string | null;
	};
	goodbye: {
		enabled: boolean;
		message: string | null;
		channel: string | null;
		withImage: string | null;
	};
	autorole: {
		enabled: boolean;
		role: string | null;
	};
	automod: {
		enabled: boolean;
		ignored: string[];
	};
	warnsSanctions: {
		kick: string | null;
		ban: string | null;
	};
	monitoring: {
		messageUpdate: string | null;
		messageDelete: string | null;
	};
	tickets: {
		count: number;
		ticketLogs: string | null;
		transcriptionLogs: string | null;
		ticketsCategory: string | null;
	};
	suggestions: string | null;
	reports: string | null;
	birthdays: string | null;
	modlogs: string | null;
};

@Entity({ collection: "guilds" })
export class Guild extends BaseEntity {
	@Property({ type: "ObjectId", primary: true })
	_id!: string;

	@Property({ type: "string", unique: true })
	id!: string;

	@Property({ type: "json" })
	membersData: Record<string, any> = {};

	@OneToMany(() => Member, (member: Member) => member.guildID)
	members = new Array<Member>();

	@Property({ type: "string" })
	language: string = client.configService.get<string>("defaultLang");

	@Property({ type: "json" })
	plugins: Plugins = {
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
		autorole: {
			enabled: false,
			role: null,
		},
		automod: {
			enabled: false,
			ignored: [],
		},
		warnsSanctions: {
			kick: null,
			ban: null,
		},
		monitoring: {
			messageUpdate: null,
			messageDelete: null,
		},
		tickets: {
			count: 0,
			ticketLogs: null,
			transcriptionLogs: null,
			ticketsCategory: null,
		},
		suggestions: null,
		reports: null,
		birthdays: null,
		modlogs: null,
	};

	hasMember(memberId: string): boolean {
		return this.members.some(member => member.id === memberId);
	}
}
