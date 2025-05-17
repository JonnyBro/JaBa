import { Client, ClientOptions } from "discord.js";
import { Handlers } from "@/handlers/index.js";
import MongooseAdapter from "@/adapters/database/MongooseAdapter.js";
import logger from "@/helpers/logger.js";
import ConfigService from "@/services/config/index.js";
import InternationalizationService from "@/services/languages/index.js";
import { SUPER_CONTEXT } from "@/constants/index.js";
import { cacheRemindsData, CommandFileObject } from "@/types.js";
import { Rainlink, Library } from "rainlink";

export class ExtendedClient extends Client<true> {
	configService = new ConfigService();
	adapter = new MongooseAdapter(this.configService.get("mongoDB"));
	cacheReminds = new Map<string, cacheRemindsData>();
	i18n = new InternationalizationService(this);
	rainlink = new Rainlink({
		library: new Library.DiscordJS(this),
		nodes: this.configService.get("music.nodes"),
	});
	commands: CommandFileObject[] = [];

	constructor(options: ClientOptions) {
		if (SUPER_CONTEXT.getStore()) return SUPER_CONTEXT.getStore() as ExtendedClient;

		super(options);

		new Handlers(this);

		this.rainlink.on("nodeConnect", node =>
			logger.ready(`Lavalink node ${node.options.name}: Ready!`),
		);
		this.rainlink.on("nodeDisconnect", (node, code, reason) => {
			logger.warn(`Lavalink node ${
				node.options.name
			}: Disconnected, Code ${code}, Reason ${reason || "No reason"}`);
		});
		this.rainlink.on("nodeClosed", node =>
			logger.warn(`Lavalink node ${node.options.name}: Closed`),
		);
		this.rainlink.on("nodeError", (node, error) =>
			logger.error(`Lavalink node ${node.options.name}: Error Caught `, error),
		);

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

		const guildData = await this.getGuildData(guildID);

		if (!guildData.members.includes(memberData._id)) {
			guildData.members.push(memberData._id);
			await guildData.save();
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
