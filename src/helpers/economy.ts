import { getNoun, translateContext } from "@/helpers/functions.js";
import { ensureMembers } from "@/helpers/members-cache.js";
import MemberModel, { IMemberSchema, Transaction } from "@/models/MemberModel.js";
import UserModel from "@/models/UserModel.js";
import useClient from "@/utils/use-client.js";
import { Guild, Interaction, Message } from "discord.js";
import { QueryFilter, Types, UpdateQuery } from "mongoose";

type MemberRef = { _id: Types.ObjectId };
type Cooldown = keyof IMemberSchema["cooldowns"];

export const formatCredits = async (context: Interaction | Message | Guild, amount: number) => {
	const forms = await Promise.all(
		["1", "2", "5"].map(form => translateContext(context, `misc:NOUNS:CREDIT:${form}`)),
	);

	const guild = context instanceof Guild ? context : context.guild;
	const locale = ("guildLocale" in context ? context.guildLocale : guild?.preferredLocale) ?? "en-US";

	return `**${amount.toLocaleString(locale)}** ${getNoun(amount, forms)}`;
};

export const cooldownTime = (until: number) => `<t:${Math.floor(until / 1000)}:R>`;

export const transaction = (user: string, amount: number, type: Transaction["type"]): Transaction => ({
	user,
	amount,
	date: Date.now(),
	type,
});

export const updateMember = (
	filter: QueryFilter<IMemberSchema>,
	changes: UpdateQuery<IMemberSchema>,
	options: { runValidators?: boolean } = {},
) => useClient().db.updateOne(MemberModel, filter, changes, options);

export const takeCredits = async (member: MemberRef, amount: number, label?: string) => {
	const result = await updateMember(
		{ _id: member._id, money: { $gte: amount } },
		{ $inc: { money: -amount }, ...(label && { $push: { transactions: transaction(label, amount, "send") } }) },
	);

	return result.modifiedCount === 1;
};

export const giveCredits = (member: MemberRef, amount: number, label?: string) =>
	updateMember(
		{ _id: member._id },
		{ $inc: { money: amount }, ...(label && { $push: { transactions: transaction(label, amount, "got") } }) },
	);

export const claimCooldown = async (
	member: MemberRef,
	cooldown: Cooldown,
	until: number,
	changes: UpdateQuery<IMemberSchema> = {},
) => {
	const path = `cooldowns.${cooldown}`;
	const result = await updateMember(
		{
			_id: member._id,
			$or: [{ [path]: { $lte: Date.now() } }, { [path]: { $exists: false } }],
		} as QueryFilter<IMemberSchema>,
		{ ...changes, $set: { ...changes.$set, [path]: until } },
	);

	return result.modifiedCount === 1;
};

export const getGlobalCredits = async (userId: string) => {
	const members = await MemberModel.find({ id: userId }, { guildID: 1, money: 1, bank: 1 }).lean();
	const guilds = useClient().guilds.cache;

	return members.filter(m => guilds.has(m.guildID)).reduce((sum, m) => sum + m.money + m.bank, 0);
};

/** How the server leaderboards sort, level ties are broken by experience */
export const LEADERBOARD_SCORES = {
	credits: { $add: [{ $ifNull: ["$money", 0] }, { $ifNull: ["$bank", 0] }] },
	level: { $add: [{ $multiply: [{ $ifNull: ["$level", 0] }, 1e9] }, { $ifNull: ["$exp", 0] }] },
};

/** Places in the server leaderboards, counted the same way: bots and members who left don't take places */
export const getRanks = async (guild: Guild, userId: string) => {
	await ensureMembers(guild);

	const docs = await MemberModel.aggregate<{ id: string; credits: number; level: number }>([
		{ $match: { guildID: guild.id } },
		{ $project: { id: 1, credits: LEADERBOARD_SCORES.credits, level: LEADERBOARD_SCORES.level } },
	]);
	const present = docs.filter(doc => {
		const member = guild.members.cache.get(doc.id);
		return member && !member.user.bot;
	});

	const own = present.find(doc => doc.id === userId);
	if (!own) return null;

	return {
		credits: present.filter(doc => doc.credits > own.credits).length + 1,
		level: present.filter(doc => doc.level > own.level).length + 1,
		total: present.length,
	};
};

export const REP_COOLDOWN = 12 * 60 * 60 * 1000;

export const giveRep = async (giverId: string, targetId: string) => {
	const client = useClient();
	await client.getUserData(giverId);

	const claimed = await client.db.updateOne(
		UserModel,
		{ id: giverId, "cooldowns.rep": { $lte: Date.now() } },
		{ $set: { "cooldowns.rep": Date.now() + REP_COOLDOWN } },
	);

	if (!claimed.modifiedCount) {
		const giver = await client.getUserData(giverId);
		return { given: false, until: giver.cooldowns.rep };
	}

	await client.getUserData(targetId);
	await client.db.updateOne(UserModel, { id: targetId }, { $inc: { rep: 1 } });

	return { given: true, until: 0 };
};
