import { Client, ClientOptions } from "discord.js";
import { Handlers } from "@/handlers/index.js";
import logger from "@/helpers/logger.js";
import ConfigService from "@/services/config/index.js";
import InternationalizationService from "@/services/languages/index.js";
import { SUPER_CONTEXT } from "@/constants/index.js";
import { cacheRemindsData } from "@/types.js";
import MikroOrmAdapter from "@/adapters/database/MikroOrmAdapter.js";
// import { Player } from "discord-player";

export class ExtendedClient extends Client<true> {
	configService = new ConfigService();
	adapter = new MikroOrmAdapter(this.configService.get("mongoDB"));
	cacheReminds = new Map<string, cacheRemindsData>();
	i18n = new InternationalizationService(this);

	constructor(options: ClientOptions) {
		if (SUPER_CONTEXT.getStore()) return SUPER_CONTEXT.getStore() as ExtendedClient;

		super(options);

		new Handlers(this);

		// @ts-ignore - because ExtendedClient != Client<boolean> from discord.js
		// new Player(this);

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
		const { Guild } = await import("@/models/GuildModel.js");
		const guildData = await this.adapter.findOneOrCreate(Guild, { id: guildId });

		return guildData;
	}

	async getUserData(userID: string) {
		const { User } = await import("@/models/UserModel.js");
		const userData = await this.adapter.findOneOrCreate(User, { id: userID });

		return userData;
	}

	async getUsersData() {
		const { User } = await import("@/models/UserModel.js");
		const usersData = await this.adapter.find(User);

		return usersData;
	}

	async getMemberData(memberId: string, guildID: string) {
		const { Member } = await import("@/models/MemberModel.js");
		const memberData = await this.adapter.findOneOrCreate(Member, {
			id: memberId,
			guildID,
		});

		const guildData = await this.getGuildData(guildID);
		const isMemberInGuild = await guildData.hasMember(memberData.id, this.adapter.em);

		if (!isMemberInGuild) {
			guildData.members.push(memberData);
			await guildData.save();
		}

		return memberData;
	}

	async getMembersData(guildID: string) {
		const { Member } = await import("@/models/MemberModel.js");
		const membersData = await this.adapter.find(Member, {
			guildID,
		});

		return membersData;
	}
}
