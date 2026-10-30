import { getNoun, translateContext } from "@/helpers/functions.js";
import MemberModel, { IMemberSchema, Transaction } from "@/models/MemberModel.js";
import useClient from "@/utils/use-client.js";
import { Interaction } from "discord.js";
import { QueryFilter, Types, UpdateQuery } from "mongoose";

type MemberRef = { _id: Types.ObjectId };
type Cooldown = keyof IMemberSchema["cooldowns"];

export const formatCredits = async (context: Interaction, amount: number) => {
	const forms = await Promise.all(
		["1", "2", "5"].map(form => translateContext(context, `misc:NOUNS:CREDIT:${form}`)),
	);

	return `**${amount.toLocaleString(context.guildLocale ?? "en-US")}** ${getNoun(amount, forms)}`;
};

export const cooldownTime = (until: number) => `<t:${Math.floor(until / 1000)}:R>`;

const transaction = (user: string, amount: number, type: Transaction["type"]): Transaction => ({
	user,
	amount,
	date: Date.now(),
	type,
});

const update = (filter: QueryFilter<IMemberSchema>, changes: UpdateQuery<IMemberSchema>) =>
	useClient().db.updateOne(MemberModel, filter, changes);

/** Every change is a single conditional update, so parallel commands and button spam can't overdraw or claim twice */
export const takeCredits = async (member: MemberRef, amount: number, label?: string) => {
	const result = await update(
		{ _id: member._id, money: { $gte: amount } },
		{ $inc: { money: -amount }, ...(label && { $push: { transactions: transaction(label, amount, "send") } }) },
	);

	return result.modifiedCount === 1;
};

export const giveCredits = (member: MemberRef, amount: number, label?: string) =>
	update(
		{ _id: member._id },
		{ $inc: { money: amount }, ...(label && { $push: { transactions: transaction(label, amount, "got") } }) },
	);

/** Starts the cooldown and applies the changes only if the previous cooldown is over */
export const claimCooldown = async (
	member: MemberRef,
	cooldown: Cooldown,
	until: number,
	changes: UpdateQuery<IMemberSchema> = {},
) => {
	const path = `cooldowns.${cooldown}`;
	const result = await update(
		{
			_id: member._id,
			$or: [{ [path]: { $lte: Date.now() } }, { [path]: { $exists: false } }],
		} as QueryFilter<IMemberSchema>,
		{ ...changes, $set: { ...changes.$set, [path]: until } },
	);

	return result.modifiedCount === 1;
};
