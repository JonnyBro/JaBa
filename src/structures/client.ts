import MongooseAdapter from "@/adapters/database/MongooseAdapter.js";
import { SUPER_CONTEXT } from "@/constants/index.js";
import { Handlers } from "@/handlers/index.js";
import { lavalinkNodesFromString } from "@/helpers/functions.js";
import logger from "@/helpers/logger.js";
import ConfigService from "@/services/config/index.js";
import InternationalizationService from "@/services/languages/index.js";
import { cacheRemindsData, CommandFileObject } from "@/types.js";
import { Client, ClientOptions } from "discord.js";
import { LavalinkManager } from "lavalink-client";

export class ExtendedClient extends Client<true> {
	configService = new ConfigService().loadConfig();
	db = new MongooseAdapter(this.configService.get<string>("MONGODB_URI"));
	cacheReminds = new Map<string, cacheRemindsData>();
	i18n = new InternationalizationService(this);
	lavalink = new LavalinkManager({
		nodes: lavalinkNodesFromString(this.configService.get<string>("LAVALINK_NODES")),
		sendToShard: (guildId, payload) => this.guilds.cache.get(guildId)?.shard?.send(payload),
		autoSkip: true,
		client: {
			id: this.configService.get<string>("CLIENT_ID"),
			username: "JaBa",
		},
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
			await this.db.connect();

			await this.lavalink.init({
				id: this.configService.get<string>("CLIENT_ID"),
				username: "JaBa",
			});

			await this.login(this.configService.get<string>("TOKEN"));
		} catch (error) {
			logger.error(error);
		}
	}

	async getGuildData(guildId: string) {
		const { default: GuildModel } = await import("@/models/GuildModel.js");
		const guildData = await this.db.findOneOrCreate(GuildModel, { id: guildId });

		return guildData;
	}

	async getGuildsData() {
		const { default: GuildModel } = await import("@/models/GuildModel.js");
		const guildsData = await this.db.find(GuildModel);

		return guildsData;
	}

	async getUserData(userID: string) {
		const { default: UserModel } = await import("@/models/UserModel.js");
		const userData = await this.db.findOneOrCreate(UserModel, { id: userID });

		return userData;
	}

	async getUsersData() {
		const { default: UserModel } = await import("@/models/UserModel.js");
		const usersData = await this.db.find(UserModel);

		return usersData;
	}

	async getMemberData(guildID: string, memberId: string) {
		const { default: MemberModel } = await import("@/models/MemberModel.js");
		const memberData = await this.db.findOneOrCreate(MemberModel, {
			id: memberId,
			guildID,
		});

		return memberData;
	}

	async getMembersData(guildID: string) {
		const { default: MemberModel } = await import("@/models/MemberModel.js");
		const membersData = await this.db.find(MemberModel, {
			guildID,
		});

		return membersData;
	}
}
