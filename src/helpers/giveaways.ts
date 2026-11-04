import { formatCredits, giveCredits } from "@/helpers/economy.js";
import { getNoun, translateContext } from "@/helpers/functions.js";
import logger from "@/helpers/logger.js";
import { getShopItem, grantItem, itemLabel } from "@/helpers/shop.js";
import GiveawayModel, { IGiveawaySchema } from "@/models/GiveawayModel.js";
import { componentRouter } from "@/utils/component-router.js";
import { createContainer, createFooter, createSeparator, createText } from "@/utils/create-container.js";
import useClient from "@/utils/use-client.js";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	Guild,
	GuildMember,
	MessageFlags,
	PermissionsBitField,
	SendableChannels,
} from "discord.js";
import { Types } from "mongoose";

export const GIVEAWAY_ID = "GIVEAWAY";

export const MIN_DURATION = 60 * 1000;
export const MAX_DURATION = 30 * 24 * 60 * 60 * 1000;
export const MAX_WINNERS = 20;
export const MAX_PRIZE = 200;
export const MAX_CREDITS = 1e9;
const MEMBERS_CHUNK = 100;

type Giveaway = IGiveawaySchema;

const t = (guildId: string, key: string, args?: Record<string, unknown>) => translateContext(guildId, key, args);

const participantsWord = async (guildId: string, count: number) =>
	getNoun(count, await Promise.all(["1", "2", "5"].map(form => t(guildId, `misc:NOUNS:MEMBERS:${form}`))));

const mentions = (ids: string[]) => ids.map(id => `<@${id}>`).join(", ");

export const renderGiveaway = async (giveaway: Giveaway, guild: Guild) => {
	const g = guild.id;
	const endsAt = Math.floor(giveaway.endsAt.getTime() / 1000);
	const item = giveaway.itemId ? await getShopItem(g, giveaway.itemId.toString()) : null;

	const host = await t(g, "general/giveaway:HOST", { user: `<@${giveaway.hostId}>` });
	const state = giveaway.ended
		? await t(g, "general/giveaway:ENDED")
		: await t(g, "general/giveaway:ENDS", { time: `<t:${endsAt}:R>` });
	const header = [`## 🎉 ${giveaway.prize}`, `-# ${host} • ${state}`];
	const credits = await formatCredits(guild, giveaway.credits);

	const details = [
		`**${await t(g, "general/giveaway:WINNERS")}:** ${giveaway.winners}`,
		giveaway.credits > 0 && `💰 ${await t(g, "general/giveaway:CREDITS_EACH", { credits })}`,
		item && `🎁 ${itemLabel(item)}`,
		giveaway.requiredLevel > 0 && (await t(g, "general/giveaway:NEED_LEVEL", { level: giveaway.requiredLevel })),
		giveaway.requiredRoleId &&
			(await t(g, "general/giveaway:NEED_ROLE", { role: `<@&${giveaway.requiredRoleId}>` })),
	].filter(Boolean);

	const container = createContainer()
		.addTextDisplayComponents(createText(header.join("\n")))
		.addSeparatorComponents(createSeparator())
		.addTextDisplayComponents(createText(details.join("\n")));

	if (giveaway.ended)
		container
			.addSeparatorComponents(createSeparator())
			.addTextDisplayComponents(
				createText(
					giveaway.winnerIds.length
						? `🏆 ${mentions(giveaway.winnerIds)}`
						: await t(g, "general/giveaway:NO_WINNERS"),
				),
			);

	const id = `${GIVEAWAY_ID}:${giveaway._id.toString()}`;
	const buttons: ButtonBuilder[] = [];

	if (giveaway.ended)
		buttons.push(
			new ButtonBuilder()
				.setCustomId(`${id}:reroll`)
				.setEmoji("🔁")
				.setLabel(await t(g, "general/giveaway:REROLL"))
				.setStyle(ButtonStyle.Secondary)
				.setDisabled(giveaway.participants.length <= giveaway.winnerIds.length),
		);
	else
		buttons.push(
			new ButtonBuilder()
				.setCustomId(`${id}:join`)
				.setEmoji("🎉")
				.setLabel(await t(g, "general/giveaway:JOIN"))
				.setStyle(ButtonStyle.Success),
			new ButtonBuilder()
				.setCustomId(`${id}:end`)
				.setLabel(await t(g, "general/giveaway:END"))
				.setStyle(ButtonStyle.Danger),
		);

	const count = giveaway.participants.length;

	container
		.addActionRowComponents(new ActionRowBuilder<ButtonBuilder>().addComponents(buttons))
		.addTextDisplayComponents(createFooter(`${count} ${await participantsWord(g, count)}`));

	return {
		flags: MessageFlags.IsComponentsV2 as const,
		components: [container],
		allowedMentions: { parse: [] },
	};
};

export type GiveawayInput = {
	channel: SendableChannels;
	hostId: string;
	prize: string;
	winners: number;
	duration: number;
	credits: number;
	itemId: string | null;
	requiredLevel: number;
	requiredRoleId: string | null;
};

export type GiveawayError = "BAD_PRIZE" | "BAD_DURATION" | "BAD_WINNERS" | "BAD_CREDITS" | "NO_ITEM" | "NO_ROLE";

export const validateGiveaway = async (guild: Guild, input: Omit<GiveawayInput, "channel" | "hostId">) => {
	if (!input.prize.trim() || input.prize.length > MAX_PRIZE) return "BAD_PRIZE";
	if (!Number.isFinite(input.duration) || input.duration < MIN_DURATION || input.duration > MAX_DURATION)
		return "BAD_DURATION";
	if (!Number.isInteger(input.winners) || input.winners < 1 || input.winners > MAX_WINNERS) return "BAD_WINNERS";
	if (!Number.isInteger(input.credits) || input.credits < 0 || input.credits > MAX_CREDITS) return "BAD_CREDITS";
	if (input.itemId && !(await getShopItem(guild.id, input.itemId))) return "NO_ITEM";
	if (input.requiredRoleId && !guild.roles.cache.has(input.requiredRoleId)) return "NO_ROLE";

	return null;
};

export const createGiveaway = async (guild: Guild, input: GiveawayInput) => {
	const giveaway = await GiveawayModel.create({
		guildId: guild.id,
		channelId: input.channel.id,
		hostId: input.hostId,
		prize: input.prize.trim(),
		winners: input.winners,
		credits: input.credits,
		itemId: input.itemId ? new Types.ObjectId(input.itemId) : null,
		requiredLevel: input.requiredLevel,
		requiredRoleId: input.requiredRoleId,
		endsAt: new Date(Date.now() + input.duration),
	});

	try {
		const message = await input.channel.send(await renderGiveaway(giveaway.toObject(), guild));
		await GiveawayModel.updateOne({ _id: giveaway._id }, { messageId: message.id });

		return { giveaway: giveaway.toObject(), url: message.url };
	} catch (error) {
		await GiveawayModel.deleteOne({ _id: giveaway._id });
		throw error;
	}
};

/** Random participants who are still on the server, skipping the ones that already won */
const pickWinners = async (guild: Guild, giveaway: Giveaway, count: number) => {
	const pool = giveaway.participants.filter(id => !giveaway.winnerIds.includes(id));

	for (let i = pool.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[pool[i], pool[j]] = [pool[j], pool[i]];
	}

	const winners: GuildMember[] = [];
	for (let i = 0; i < pool.length && winners.length < count; i += MEMBERS_CHUNK) {
		const members = await guild.members.fetch({ user: pool.slice(i, i + MEMBERS_CHUNK) }).catch(() => null);
		if (!members) continue;

		for (const id of pool.slice(i, i + MEMBERS_CHUNK))
			if (members.has(id) && winners.length < count) winners.push(members.get(id)!);
	}

	return winners;
};

const award = async (giveaway: Giveaway, winners: GuildMember[]) => {
	const item = giveaway.itemId ? await getShopItem(giveaway.guildId, giveaway.itemId.toString()) : null;
	const label = await t(giveaway.guildId, "general/giveaway:TRANSACTION", { prize: giveaway.prize });

	for (const member of winners)
		try {
			if (giveaway.credits > 0) {
				const memberData = await useClient().getMemberData(giveaway.guildId, member.id);
				await giveCredits(memberData, giveaway.credits, label);
			}

			if (item) await grantItem(member, item);
		} catch (error) {
			logger.warn(`[Giveaways] Can't give the prize of ${giveaway._id} to ${member.id}:`, error);
		}
};

const announce = async (giveaway: Giveaway, guild: Guild, winners: GuildMember[], reroll = false) => {
	const channel = await guild.channels.fetch(giveaway.channelId).catch(() => null);
	if (!channel?.isSendable()) return;

	const key = winners.length
		? reroll
			? "general/giveaway:REROLLED"
			: "general/giveaway:CONGRATS"
		: "general/giveaway:NOBODY";

	await channel
		.send({
			content: `🎉 ${await t(guild.id, key, { users: mentions(winners.map(m => m.id)), prize: giveaway.prize })}`,
			reply: giveaway.messageId ? { messageReference: giveaway.messageId, failIfNotExists: false } : undefined,
			allowedMentions: { users: winners.map(m => m.id) },
		})
		.catch(error => logger.warn(`[Giveaways] Can't announce ${giveaway._id}:`, error.message));
};

const refreshMessage = async (giveaway: Giveaway, guild: Guild, interaction?: ButtonInteraction) => {
	const message = await renderGiveaway(giveaway, guild);
	if (interaction) return void (await interaction.editReply(message));
	if (!giveaway.messageId) return;

	const channel = await guild.channels.fetch(giveaway.channelId).catch(() => null);
	if (channel?.isTextBased())
		await channel.messages.edit(giveaway.messageId, message).catch(error => {
			logger.warn(`[Giveaways] Can't edit ${giveaway._id}:`, error.message);
		});
};

/** Ends the giveaway once, a manual end and the cron task can race for it */
export const endGiveaway = async (giveawayId: string, interaction?: ButtonInteraction) => {
	const giveaway = await GiveawayModel.findOneAndUpdate(
		{ _id: giveawayId, ended: false },
		{ ended: true },
		{ returnDocument: "after" },
	).lean();
	if (!giveaway) return false;

	const guild = useClient().guilds.cache.get(giveaway.guildId);
	if (!guild) return true;

	const winners = await pickWinners(guild, giveaway, giveaway.winners);
	giveaway.winnerIds = winners.map(m => m.id);
	await GiveawayModel.updateOne({ _id: giveaway._id }, { winnerIds: giveaway.winnerIds });

	await refreshMessage(giveaway, guild, interaction);
	await announce(giveaway, guild, winners);
	await award(giveaway, winners);

	return true;
};

/** Draws one more winner among those who haven't won yet, the earlier winners keep their prize */
export const rerollGiveaway = async (giveawayId: string, interaction?: ButtonInteraction) => {
	const giveaway = await GiveawayModel.findOne({ _id: giveawayId, ended: true }).lean();
	if (!giveaway) return "NOT_ENDED" as const;

	const guild = useClient().guilds.cache.get(giveaway.guildId);
	if (!guild) return "NOT_ENDED" as const;

	const [winner] = await pickWinners(guild, giveaway, 1);
	if (!winner) return "NO_ONE_LEFT" as const;

	// The id check stops two rerolls at once from picking the same person twice
	const result = await GiveawayModel.updateOne(
		{ _id: giveaway._id, winnerIds: { $ne: winner.id } },
		{ $push: { winnerIds: winner.id } },
	);
	if (!result.modifiedCount) return "NO_ONE_LEFT" as const;

	giveaway.winnerIds.push(winner.id);

	await refreshMessage(giveaway, guild, interaction);
	await announce(giveaway, guild, [winner], true);
	await award(giveaway, [winner]);

	return winner;
};

export const isGiveawayManager = (member: GuildMember | null) =>
	!!member?.permissions.has(PermissionsBitField.Flags.ManageGuild);

const ephemeral = async (interaction: ButtonInteraction, content: string) => {
	const payload = { content, allowedMentions: { parse: [] } };

	if (interaction.deferred || interaction.replied)
		await interaction.followUp({ ...payload, flags: MessageFlags.Ephemeral });
	else await interaction.reply({ ...payload, flags: MessageFlags.Ephemeral });
};

const join = async (interaction: ButtonInteraction, giveaway: Giveaway) => {
	const g = giveaway.guildId;
	const member = interaction.member as GuildMember;

	if (giveaway.participants.includes(member.id)) {
		await GiveawayModel.updateOne({ _id: giveaway._id, ended: false }, { $pull: { participants: member.id } });
		await interaction.deferUpdate();
		await refreshMessage(
			(await GiveawayModel.findById(giveaway._id).lean()) ?? giveaway,
			interaction.guild!,
			interaction,
		);
		return ephemeral(interaction, await t(g, "general/giveaway:LEFT"));
	}

	if (giveaway.requiredRoleId && !member.roles.cache.has(giveaway.requiredRoleId))
		return ephemeral(
			interaction,
			await t(g, "general/giveaway:NEED_ROLE_ERROR", { role: `<@&${giveaway.requiredRoleId}>` }),
		);

	if (giveaway.requiredLevel > 0) {
		const memberData = await useClient().getMemberData(g, member.id);
		if (memberData.level < giveaway.requiredLevel)
			return ephemeral(
				interaction,
				await t(g, "general/giveaway:NEED_LEVEL_ERROR", { level: giveaway.requiredLevel }),
			);
	}

	const result = await GiveawayModel.updateOne(
		{ _id: giveaway._id, ended: false },
		{ $addToSet: { participants: member.id } },
	);
	if (!result.matchedCount) return ephemeral(interaction, await t(g, "general/giveaway:ALREADY_ENDED"));

	await interaction.deferUpdate();
	await refreshMessage(
		(await GiveawayModel.findById(giveaway._id).lean()) ?? giveaway,
		interaction.guild!,
		interaction,
	);
	await ephemeral(interaction, await t(g, "general/giveaway:JOINED"));
};

componentRouter.register(GIVEAWAY_ID, async interaction => {
	if (!interaction.isButton() || !interaction.inGuild()) return;

	const [, giveawayId, action] = interaction.customId.split(":");
	const giveaway = Types.ObjectId.isValid(giveawayId) ? await GiveawayModel.findById(giveawayId).lean() : null;

	if (!giveaway) return ephemeral(interaction, await translateContext(interaction, "general/giveaway:NOT_FOUND"));

	if (action === "join") {
		if (giveaway.ended) return ephemeral(interaction, await t(giveaway.guildId, "general/giveaway:ALREADY_ENDED"));
		return join(interaction, giveaway);
	}

	if (!isGiveawayManager(interaction.member as GuildMember))
		return ephemeral(interaction, await t(giveaway.guildId, "general/giveaway:MANAGERS_ONLY"));

	if (action === "end") {
		await interaction.deferUpdate();
		if (!(await endGiveaway(giveawayId, interaction)))
			await ephemeral(interaction, await t(giveaway.guildId, "general/giveaway:ALREADY_ENDED"));
		return;
	}

	if (action === "reroll") {
		await interaction.deferUpdate();
		const result = await rerollGiveaway(giveawayId, interaction);
		if (result === "NO_ONE_LEFT")
			await ephemeral(interaction, await t(giveaway.guildId, "general/giveaway:NO_ONE_LEFT"));
	}
});
