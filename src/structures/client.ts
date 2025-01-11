import { Client, ClientOptions } from "discord.js";
import { TOptionsBase } from "i18next";
import { Handlers } from "@/handlers/index.js";
import MongooseAdapter from "@/adapters/database/MongooseAdapter.js";
import logger from "@/helpers/logger.js";
import ConfigService from "@/services/config/index.js";
import InternationalizationService from "@/services/languages/index.js";
import { SUPER_CONTEXT } from "@/constants/index.js";
import { cacheRemindsData } from "@/types.js";

export class ExtendedClient extends Client<true> {
	configService = new ConfigService();
	adapter = new MongooseAdapter(this.configService.get("mongoDB"));
	cacheReminds = new Map<string, cacheRemindsData>();
	i18n = new InternationalizationService(this);
	translate!: (
		_key: string,
		_options?:
			| TOptionsBase
			| {
					[key: string]: string;
			  },
	) => string;

	constructor(options: ClientOptions) {
		if (SUPER_CONTEXT.getStore()) {
			return SUPER_CONTEXT.getStore() as ExtendedClient;
		}
		super(options);

		new Handlers(this);
		SUPER_CONTEXT.enterWith(this);
	}

	async init() {
		try {
			await this.adapter.connect();
			await this.login(this.configService.get("token"));
		} catch (error) {
			logger.error(error);
		}
	}

	async getGuildData(guildId: string) {
		const { default: GuildModel } = await import("@/models/GuildModel.js");
		const guildData = await this.adapter.findOneOrCreate(GuildModel, { id: guildId });

		return guildData;
	}

	async getUserData(userID: string) {
		const { default: UserModel } = await import("@/models/UserModel.js");
		const userData = await this.adapter.findOneOrCreate(UserModel, { id: userID });

		return userData;
	}

	async getMemberData(memberId: string, guildID: string) {
		const { default: MemberModel } = await import("@/models/MemberModel.js");
		const memberData = await this.adapter.findOneOrCreate(MemberModel, { id: memberId, guildID });

		const guildData = await this.getGuildData(guildID);

		guildData.members.push(memberData.id);
		await guildData.save();

		return memberData;
	}
}
