import { LEADERBOARD_SCORES } from "@/helpers/economy.js";
import { getXpForNextLevel } from "@/helpers/functions.js";
import MemberModel from "@/models/MemberModel.js";
import { FastifyInstance } from "fastify";
import { ensureMembers } from "@/helpers/members-cache.js";
import { send } from "../../utils.js";

const LIMIT = 50;

export default async function leaderboardRoutes(fastify: FastifyInstance) {
	fastify.get("/leaderboard", async (req, reply) => {
		const guild = req.guild;
		const type = (req.query as { type?: string }).type === "level" ? "level" : "credits";

		await ensureMembers(guild);

		// Members who left or are bots are skipped, so a few extra are fetched
		const docs = await MemberModel.aggregate<{
			id: string;
			money: number;
			bank: number;
			level: number;
			exp: number;
		}>([
			{ $match: { guildID: guild.id } },
			{ $addFields: { score: LEADERBOARD_SCORES[type] } },
			{ $sort: { score: -1 } },
			{ $limit: LIMIT * 2 },
		]);

		const items = docs
			.map(doc => ({ doc, member: guild.members.cache.get(doc.id) }))
			.filter(({ member }) => member && !member.user.bot)
			.slice(0, LIMIT)
			.map(({ doc, member }, i) => ({
				position: i + 1,
				id: doc.id,
				displayName: member!.displayName,
				avatar: member!.displayAvatarURL({ size: 64 }),
				money: doc.money ?? 0,
				bank: doc.bank ?? 0,
				level: doc.level ?? 0,
				exp: doc.exp ?? 0,
				nextLevelExp: getXpForNextLevel(doc.level ?? 0),
			}));

		return send(reply, { type, items });
	});
}
