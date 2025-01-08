import { Client } from "discord.js";
import { Player } from "discord-player";
import MongooseAdapter from "../adapters/database/MongooseAdapter.js";
import logger from "../helpers/logger.js";
import { Handlers } from "../handlers/index.js";
import ConfigService from "../services/config/index.js";
import InternationalizationService from "../services/languages/index.js";
import { SUPER_CONTEXT } from "../constants/index.js";

export class ExtendedClient extends Client {
	/**
	 * @param {import("discord.js").ClientOptions} options
	 */
	constructor(options) {
		if (SUPER_CONTEXT.getStore()) {
			return SUPER_CONTEXT.getStore();
		}
		super(options);

		this.configService = new ConfigService();
		this.adapter = new MongooseAdapter(this.configService.get("mongoDB"));
		this.i18n = new InternationalizationService(this);
		this.cacheReminds = new Map();
		new Player(this);
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

	/**
	 * Retrieves a guild data object from the database.
	 * @param {string} guildId - The ID of the guild to find or create.
	 * @returns {Promise<GuildModel>} The guild data object, either retrieved from the database or newly created.
	 */
	async getGuildData(guildId) {
		const { default: GuildModel } = await import("../models/GuildModel.js");
		let guildData = await this.adapter.findOne(GuildModel, { id: guildId });

		if (!guildData) {
			guildData = new GuildModel({ id: guildId });
			await guildData.save();
		}

		return guildData;
	}

	/**
	 * Returns a User data from the database.
	 * @param {string} userID - The ID of the user to find or create.
	 * @returns {Promise<UserModel>} The user data object, either retrieved from the database or newly created.
	 */
	async getUserData(userID) {
		const { default: UserModel } = await import("../models/GuildModel.js");
		let userData = await this.adapter.findOne(UserModel, { id: userID });

		if (!userData) {
			userData = new UserModel({ id: userID });
			await userData.save();
		}

		return userData;
	}

	/**
	 * Returns a Member data from the database.
	 * @param {string} memberId - The ID of the member to find or create.
	 * @param {string} guildId - The ID of the guild the member belongs to.
	 * @returns {Promise<MemberModel>} The member data object, either retrieved from the database or newly created.
	 */
	async getMemberData(memberId, guildId) {
		const { default: MemberModel } = await import("../models/GuildModel.js");
		let memberData = await this.adapter.findOne(MemberModel, { guildID: guildId, id: memberId });

		if (!memberData) {
			memberData = new MemberModel({ id: memberId, guildID: guildId });
			await memberData.save();

			const guildData = await this.getGuildData(guildId);

			if (guildData) {
				guildData.members.push(memberData._id);
				await guildData.save();
			}
		}

		return memberData;
	}
}
