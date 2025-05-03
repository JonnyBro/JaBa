import { Client, ClientOptions } from "discord.js";
import { GiveawaysManager } from "discord-giveaways";
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

	// @ts-ignore - because ExtendedClient != Client<boolean> from discord.js
	giveaways = new GiveawaysManager(this, {
		storage: "./giveaways.json",
		default: {
			botsCanWin: false,
			embedColor: this.configService.get("embed.color"),
			embedColorEnd: "#FF0000",
			reaction: "🎉",
		},
	});

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
		const { Guild: GuildModel } = await import("@/models/GuildModel.js");
		const guildData = await this.adapter.findOneOrCreate(GuildModel, { id: guildId });

		return guildData;
	}

	async getUserData(userID: string) {
		const { User: UserModel } = await import("@/models/UserModel.js");
		const userData = await this.adapter.findOneOrCreate(UserModel, { id: userID });

		return userData;
	}

	async getUsersData() {
		const { default: UserModel } = await import("@/models/UserModel.js");
		const usersData = await this.adapter.find(UserModel);

		return usersData;
	}

	async getMemberData(memberId: string, guildID: string) {
		const { Member: MemberModel } = await import("@/models/MemberModel.js");
		const memberData = await this.adapter.findOneOrCreate(MemberModel, {
			id: memberId,
			guildID,
		});

		const guildData = await this.getGuildData(guildID);

		if (!guildData.hasMember(memberData.id)) {
			guildData.members.push(memberData);
			await this.adapter.em.flush();
		}

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
