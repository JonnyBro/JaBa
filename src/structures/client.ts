import MongooseAdapter from "@/adapters/database/MongooseAdapter.js";
import { SUPER_CONTEXT } from "@/constants/index.js";
import { Handlers } from "@/handlers/index.js";
import logger from "@/helpers/logger.js";
import ConfigService from "@/services/config/index.js";
import InternationalizationService from "@/services/languages/index.js";
import { cacheRemindsData, CommandFileObject } from "@/types.js";
import { Client, ClientOptions } from "discord.js";
import { Library, Rainlink, RainlinkNodeOptions } from "rainlink";

export class ExtendedClient extends Client<true> {
	configService = new ConfigService();
	adapter = new MongooseAdapter(this.configService.get<string>("mongoDB"));
	cacheReminds = new Map<string, cacheRemindsData>();
	i18n = new InternationalizationService(this);
	rainlink = new Rainlink({
		library: new Library.DiscordJS(this),
		nodes: this.configService.get<RainlinkNodeOptions[]>("music.nodes"),
	});
	commands: CommandFileObject[] = [];

	constructor(options: ClientOptions) {
		if (SUPER_CONTEXT.getStore()) return SUPER_CONTEXT.getStore() as ExtendedClient;

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

	async getGuildsData() {
		const { default: GuildModel } = await import("@/models/GuildModel.js");
		const guildsData = await this.adapter.find(GuildModel);

		return guildsData;
	}

	async getUserData(userID: string) {
		const { default: UserModel } = await import("@/models/UserModel.js");
		const userData = await this.adapter.findOneOrCreate(UserModel, { id: userID });

		return userData;
	}

	async getUsersData() {
		const { default: UserModel } = await import("@/models/UserModel.js");
		const usersData = await this.adapter.find(UserModel);

		return usersData;
	}

	async getMemberData(memberId: string, guildID: string) {
		const { default: MemberModel } = await import("@/models/MemberModel.js");
		const memberData = await this.adapter.findOneOrCreate(MemberModel, {
			id: memberId,
			guildID,
		});

		return memberData;
	}

	async getMembersData(guildID: string) {
		const { default: MemberModel } = await import("@/models/MemberModel.js");
		const membersData = await this.adapter.find(MemberModel, {
			guildID,
		});

		return membersData;
	}
}
