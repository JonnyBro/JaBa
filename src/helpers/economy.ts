import { getNoun, translateContext } from "@/helpers/functions.js";
import MemberModel, { IMemberSchema, Transaction } from "@/models/MemberModel.js";
import UserModel from "@/models/UserModel.js";
import useClient from "@/utils/use-client.js";
import { Interaction, Message } from "discord.js";
import { QueryFilter, Types, UpdateQuery } from "mongoose";

type MemberRef = { _id: Types.ObjectId };
type Cooldown = keyof IMemberSchema["cooldowns"];

export const formatCredits = async (context: Interaction | Message, amount: number) => {
	const forms = await Promise.all(
		["1", "2", "5"].map(form => translateContext(context, `misc:NOUNS:CREDIT:${form}`)),
	);

	const locale = ("guildLocale" in context ? context.guildLocale : context.guild?.preferredLocale) ?? "en-US";

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
