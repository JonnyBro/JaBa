import { getNoun, shortenString, translateContext } from "@/helpers/functions.js";
import logger from "@/helpers/logger.js";
import PollModel, { IPollSchema } from "@/models/PollModel.js";
import { componentRouter } from "@/utils/component-router.js";
import { createContainer, createFooter, createSeparator, createText } from "@/utils/create-container.js";
import useClient from "@/utils/use-client.js";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	GuildMember,
	MessageFlags,
	PermissionsBitField,
} from "discord.js";

export const POLL_ID = "POLL";

const BAR_SIZE = 12;
const BUTTONS_PER_ROW = 5;
const VOTERS_PER_OPTION = 30;

type Poll = Pick<
	IPollSchema,
	| "_id"
	| "guildId"
	| "authorId"
	| "question"
	| "options"
	| "votes"
	| "anonymous"
	| "multiple"
	| "hidden"
	| "endsAt"
	| "ended"
>;

const t = (poll: Pick<IPollSchema, "guildId">, key: string, args?: Record<string, unknown>) =>
	translateContext(poll.guildId, key, args);

const votesWord = async (poll: Poll, count: number) =>
	getNoun(count, await Promise.all(["1", "2", "5"].map(form => t(poll, `general/poll:VOTES:${form}`))));

/** How many voters picked each option */
const tally = (poll: Poll) => {
	const counts = poll.options.map(() => 0);
	for (const choices of Object.values(poll.votes)) for (const i of choices) counts[i]++;

	return counts;
};

const bar = (share: number) => {
	const filled = Math.round(share * BAR_SIZE);
	return `${"▰".repeat(filled)}${"▱".repeat(BAR_SIZE - filled)}`;
};

export const renderPoll = async (poll: Poll) => {
	const voters = Object.keys(poll.votes).length;
	const counts = tally(poll);
	const showResults = poll.ended || !poll.hidden;
	const endsAt = Math.floor(poll.endsAt.getTime() / 1000);

	const flags = [
		poll.ended
			? await t(poll, "general/poll:ENDED")
			: await t(poll, "general/poll:ENDS", { time: `<t:${endsAt}:R>` }),
		poll.anonymous && (await t(poll, "general/poll:ANONYMOUS")),
		poll.multiple && (await t(poll, "general/poll:MULTIPLE")),
		poll.hidden && !poll.ended && (await t(poll, "general/poll:HIDDEN")),
	].filter(Boolean);

	const options = await Promise.all(
		poll.options.map(async (option, i) => {
			if (!showResults) return `**${i + 1}.** ${option}`;

			// Shares are of the voters, so with multiple answers they can add up to more than 100%
			const share = voters ? counts[i] / voters : 0;

			const stats = `${Math.round(share * 100)}% · ${counts[i]} ${await votesWord(poll, counts[i])}`;

			return `**${i + 1}.** ${option}\n${bar(share)} ${stats}`;
		}),
	);

	const container = createContainer()
		.addTextDisplayComponents(
			createText(`## 📊 ${poll.question}`),
			createText(
				`-# ${await t(poll, "general/poll:AUTHOR", { user: `<@${poll.authorId}>` })} • ${flags.join(" • ")}`,
			),
		)
		.addSeparatorComponents(createSeparator())
		.addTextDisplayComponents(createText(options.join("\n\n")))
		.addSeparatorComponents(createSeparator());

	const id = `${POLL_ID}:${poll._id.toString()}`;

	if (!poll.ended)
		for (let start = 0; start < poll.options.length; start += BUTTONS_PER_ROW)
			container.addActionRowComponents(
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					poll.options.slice(start, start + BUTTONS_PER_ROW).map((option, offset) =>
						new ButtonBuilder()
							.setCustomId(`${id}:vote:${start + offset}`)
							.setLabel(shortenString(`${start + offset + 1}. ${option}`, 80))
							.setStyle(ButtonStyle.Secondary),
					),
				),
			);

	const controls = [
		!poll.anonymous &&
			new ButtonBuilder()
				.setCustomId(`${id}:voters`)
				.setEmoji("👥")
				.setLabel(await t(poll, "general/poll:VOTERS_BUTTON"))
				.setStyle(ButtonStyle.Secondary),
		!poll.ended &&
			new ButtonBuilder()
				.setCustomId(`${id}:end`)
				.setLabel(await t(poll, "general/poll:END_BUTTON"))
				.setStyle(ButtonStyle.Danger),
	].filter((button): button is ButtonBuilder => !!button);

	if (controls.length)
		container.addActionRowComponents(new ActionRowBuilder<ButtonBuilder>().addComponents(controls));

	container.addTextDisplayComponents(
		createFooter(await t(poll, "general/poll:TOTAL", { count: voters, votes: await votesWord(poll, voters) })),
	);

	return { flags: MessageFlags.IsComponentsV2 as const, components: [container], allowedMentions: { parse: [] } };
};

const summary = async (poll: Poll) => {
	const voters = Object.keys(poll.votes).length;
	if (!voters) return t(poll, "general/poll:RESULT_EMPTY", { question: poll.question, user: `<@${poll.authorId}>` });

	const counts = tally(poll);
	const top = Math.max(...counts);
	const winners = poll.options.filter((_, i) => counts[i] === top).map(option => `**${option}**`);

	return t(poll, winners.length > 1 ? "general/poll:RESULT_TIE" : "general/poll:RESULT", {
		question: poll.question,
		user: `<@${poll.authorId}>`,
		winner: winners.join(", "),
		count: top,
		votes: await votesWord(poll, top),
		percent: Math.round((top / voters) * 100),
	});
};

/** Ends the poll once, a manual end and the cron task can race for it */
export const endPoll = async (pollId: string, interaction?: ButtonInteraction) => {
	const poll = await PollModel.findOneAndUpdate(
		{ _id: pollId, ended: false },
		{ ended: true },
		{ returnDocument: "after" },
	).lean();
	if (!poll) return false;

	const message = await renderPoll(poll);
	const client = useClient();

	try {
		if (interaction) await interaction.update(message);

		const channel = await client.channels.fetch(poll.channelId);
		if (!channel?.isSendable()) return true;

		if (!interaction && poll.messageId)
			await channel.messages.edit(poll.messageId, message).catch(error => {
				logger.warn(`[Polls] Can't edit poll ${poll._id}:`, error.message);
			});

		await channel.send({
			content: await summary(poll),
			reply: poll.messageId ? { messageReference: poll.messageId, failIfNotExists: false } : undefined,
			allowedMentions: { users: [poll.authorId] },
		});
	} catch (error) {
		logger.warn(`[Polls] Can't post the result of poll ${poll._id}:`, error);
	}

	return true;
};

const reply = async (interaction: ButtonInteraction, content: string) =>
	interaction.reply({ content, flags: MessageFlags.Ephemeral, allowedMentions: { parse: [] } });

const vote = async (interaction: ButtonInteraction, poll: Poll, index: number) => {
	const userId = interaction.user.id;
	const current = poll.votes[userId] ?? [];

	let choices: number[];
	if (poll.multiple)
		choices = current.includes(index)
			? current.filter(i => i !== index)
			: [...current, index].sort((a, b) => a - b);
	else choices = current.length === 1 && current[0] === index ? [] : [index];

	const path = `votes.${userId}`;
	const result = await PollModel.updateOne(
		{ _id: poll._id, ended: false },
		choices.length ? { $set: { [path]: choices } } : { $unset: { [path]: "" } },
	);
	if (!result.modifiedCount) return reply(interaction, await t(poll, "general/poll:ALREADY_ENDED"));

	const updated = await PollModel.findById(poll._id).lean();
	if (updated) await interaction.update(await renderPoll(updated));

	// With hidden results the message doesn't change, so the voter needs to see what was counted
	if (poll.hidden || poll.anonymous)
		await interaction.followUp({
			content: choices.length
				? await t(poll, "general/poll:YOUR_VOTE", { options: choices.map(i => poll.options[i]).join(", ") })
				: await t(poll, "general/poll:VOTE_REMOVED"),
			flags: MessageFlags.Ephemeral,
		});
};

const voters = async (interaction: ButtonInteraction, poll: Poll) => {
	const lines = poll.options.map((option, i) => {
		const ids = Object.entries(poll.votes)
			.filter(([, choices]) => choices.includes(i))
			.map(([id]) => `<@${id}>`);
		const shown = ids.slice(0, VOTERS_PER_OPTION).join(", ");
		const more = ids.length > VOTERS_PER_OPTION ? ` +${ids.length - VOTERS_PER_OPTION}` : "";

		return `**${i + 1}. ${option}**\n${shown ? shown + more : "—"}`;
	});

	await reply(interaction, shortenString(lines.join("\n\n"), 2000));
};

const canEnd = (interaction: ButtonInteraction, poll: Poll) =>
	interaction.user.id === poll.authorId ||
	(interaction.member as GuildMember | null)?.permissions.has(PermissionsBitField.Flags.ManageMessages);

componentRouter.register(POLL_ID, async interaction => {
	if (!interaction.isButton()) return;

	const [, pollId, action, index] = interaction.customId.split(":");
	const poll = /^[a-f\d]{24}$/i.test(pollId) ? await PollModel.findById(pollId).lean() : null;

	if (!poll) {
		await interaction.reply({
			content: await translateContext(interaction, "general/poll:NOT_FOUND"),
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	if (action === "voters") {
		if (poll.anonymous || (poll.hidden && !poll.ended))
			return void (await reply(interaction, await t(poll, "general/poll:VOTERS_HIDDEN")));

		return void (await voters(interaction, poll));
	}

	if (poll.ended) return void (await reply(interaction, await t(poll, "general/poll:ALREADY_ENDED")));

	if (action === "end") {
		if (!canEnd(interaction, poll)) return void (await reply(interaction, await t(poll, "general/poll:CANT_END")));

		await endPoll(pollId, interaction);
		return;
	}

	if (action === "vote") await vote(interaction, poll, Number(index));
});
