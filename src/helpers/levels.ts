import { formatCredits, giveCredits } from "@/helpers/economy.js";
import { translateContext } from "@/helpers/functions.js";
import logger from "@/helpers/logger.js";
import useClient from "@/utils/use-client.js";
import { Guild, Message } from "discord.js";
import { Types } from "mongoose";

/** Hands out the reward of the reached level and congratulates the member where the server wants it */
export const handleLevelUp = async (message: Message<true>, memberRef: { _id: Types.ObjectId }, level: number) => {
	const client = useClient();
	const { levels } = (await client.getGuildData(message.guildId)).plugins;
	const member = message.member ?? (await message.guild.members.fetch(message.author.id));
	const reward = levels.rewards.find(r => r.level === level);
	const t = (key: string, args?: Record<string, unknown>) => translateContext(message, key, args);

	const gained: string[] = [];

	if (reward?.credits) {
		await giveCredits(memberRef, reward.credits, await t("misc:LEVEL_REWARD_TRANSACTION", { level }));
		gained.push(await formatCredits(message, reward.credits));
	}

	const role = reward?.roleId ? message.guild.roles.cache.get(reward.roleId) : null;
	if (role?.editable)
		try {
			await member.roles.add(role, `Reached level ${level}`);
			gained.push(role.toString());

			if (!levels.stack) {
				const lower = levels.rewards
					.map(r => r.roleId)
					.filter((id): id is string => !!id && id !== role.id && member.roles.cache.has(id));

				if (lower.length) await member.roles.remove(lower, `Reached level ${level}`);
			}
		} catch (error) {
			logger.warn(`[Levels] Can't give the level ${level} role in ${message.guildId}:`, error);
		}

	if (levels.mode === "off") return;

	const lines = [
		await t(levels.mode === "reply" ? "misc:LEVEL_UP" : "misc:LEVEL_UP_USER", {
			level,
			user: member.toString(),
		}),
	];
	if (gained.length) lines.push(`🎁 ${await t("misc:LEVEL_REWARD", { rewards: gained.join(", ") })}`);

	const content = lines.join("\n");

	if (levels.mode === "reply") {
		await message.reply({ content, allowedMentions: { parse: [], repliedUser: false } });
		return;
	}

	const channel = levels.channel ? await message.guild.channels.fetch(levels.channel).catch(() => null) : null;
	if (!channel?.isSendable()) return;

	await channel.send({ content, allowedMentions: { users: [member.id] } });
};

const syncing = new Set<string>();

export const isSyncingLevelRoles = (guildId: string) => syncing.has(guildId);

/**
 * Gives every member the reward roles of the levels they already have, and with stacking off takes the lower ones.
 * Credits aren't paid here, there's no record of who already got them on level up
 */
export const syncLevelRoles = async (guild: Guild, members: { id: string; level: number }[]) => {
	const { levels } = (await useClient().getGuildData(guild.id)).plugins;
	const rewards = levels.rewards
		.filter(r => r.roleId && guild.roles.cache.get(r.roleId)?.editable)
		.sort((a, b) => a.level - b.level);

	syncing.add(guild.id);
	let updated = 0;

	try {
		for (const { id, level } of members) {
			const member = guild.members.cache.get(id);
			if (!member || member.user.bot) continue;

			const earned = rewards.filter(r => r.level <= level).map(r => r.roleId!);
			const keep = levels.stack ? earned : earned.slice(-1);
			const toAdd = keep.filter(roleId => !member.roles.cache.has(roleId));
			const extra = rewards.map(r => r.roleId!).filter(id => !keep.includes(id) && member.roles.cache.has(id));
			const toRemove = levels.stack ? [] : extra;

			if (!toAdd.length && !toRemove.length) continue;

			try {
				if (toAdd.length) await member.roles.add(toAdd, "Level rewards sync");
				if (toRemove.length) await member.roles.remove(toRemove, "Level rewards sync");
				updated++;
			} catch (error) {
				logger.warn(`[Levels] Can't sync the reward roles of ${id} in ${guild.id}:`, error);
			}
		}
	} finally {
		syncing.delete(guild.id);
	}

	logger.info(`[Levels] Synced reward roles in ${guild.id}: ${updated} member(s) updated`);

	return updated;
};
