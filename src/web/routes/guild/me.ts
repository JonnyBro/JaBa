import { getRanks } from "@/helpers/economy.js";
import { getXpForNextLevel } from "@/helpers/functions.js";
import { activeEffects, getShopItems } from "@/helpers/shop.js";
import { getWarnSettings, isActive, shortId } from "@/helpers/warns.js";
import WarnModel from "@/models/WarnModel.js";
import useClient from "@/utils/use-client.js";
import { FastifyInstance } from "fastify";
import { fail, send } from "../../utils.js";

const MAX_TRANSACTIONS = 20;

export default async function meRoutes(fastify: FastifyInstance) {
	fastify.get("/me", async (req, reply) => {
		const client = useClient();
		const guild = req.guild;
		const userId = req.session.user!.id;

		const member = await guild.members.fetch(userId).catch(() => null);
		if (!member) return fail(reply, 404, "You're not on this server");

		const [memberData, userData, shopItems, ranks, warns, warnSettings] = await Promise.all([
			client.getMemberData(guild.id, userId),
			client.getUserData(userId),
			getShopItems(guild.id),
			getRanks(guild, userId),
			WarnModel.find({ guildId: guild.id, userId, removedAt: null }).sort({ createdAt: -1 }).lean(),
			getWarnSettings(guild.id),
		]);

		const shopById = new Map(shopItems.map(item => [item._id.toString(), item]));
		const inventory = memberData.inventory
			.map(entry => ({ item: shopById.get(entry.item.toString()), quantity: entry.quantity }))
			.filter(entry => entry.item && entry.quantity > 0)
			.map(({ item, quantity }) => ({
				id: item!._id.toString(),
				name: item!.name,
				emoji: item!.emoji ?? null,
				description: item!.description || null,
				type: item!.type,
				quantity,
			}));

		return send(reply, {
			displayName: member.displayName,
			avatar: member.displayAvatarURL({ size: 256 }),
			joinedAt: member.joinedTimestamp,
			money: memberData.money,
			bank: memberData.bank,
			level: memberData.level,
			exp: memberData.exp,
			nextLevelExp: getXpForNextLevel(memberData.level),
			ranks,
			dailyStreak: memberData.dailyStreak ?? 0,
			cooldowns: {
				daily: memberData.cooldowns.daily ?? 0,
				work: memberData.cooldowns.work ?? 0,
				rob: memberData.cooldowns.rob ?? 0,
			},
			inventory,
			effects: activeEffects(memberData),
			transactions: [...memberData.transactions]
				.sort((a, b) => b.date - a.date)
				.slice(0, MAX_TRANSACTIONS)
				.map(({ user, amount, date, type }) => ({ user, amount, date, type })),
			warns: warns
				.filter(warn => isActive(warn, warnSettings))
				.map(warn => ({ id: shortId(warn), reason: warn.reason, createdAt: warn.createdAt.getTime() })),
			registeredAt: memberData.registeredAt,
			rep: userData.rep,
		});
	});
}
