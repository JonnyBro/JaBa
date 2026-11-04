import logger from "@/helpers/logger.js";
import { buildContainer, fillBlocks, parseColor } from "@/helpers/message-blocks.js";
import { GreetingMessage } from "@/models/GuildModel.js";
import useClient from "@/utils/use-client.js";
import { GuildMember, MessageCreateOptions, MessageFlags, PartialGuildMember } from "discord.js";

export type GreetingKind = "welcome" | "goodbye" | "dm";

export const buildGreeting = (
	member: GuildMember | PartialGuildMember,
	message: GreetingMessage,
	kind: GreetingKind,
): MessageCreateOptions => {
	const blocks = fillBlocks(message.blocks, {
		user: member.toString(),
		username: member.user.username,
		server: member.guild.name,
		count: member.guild.memberCount.toLocaleString(member.guild.preferredLocale),
	});

	return {
		flags: MessageFlags.IsComponentsV2,
		components: [
			buildContainer(
				blocks,
				parseColor(message.color),
				message.avatar ? member.displayAvatarURL({ size: 256 }) : null,
			),
		],
		// Only the welcome pings the newcomer, someone who left can't be pinged and a DM doesn't need it
		allowedMentions: { users: kind === "welcome" ? [member.id] : [] },
	};
};

export const sendGreeting = async (member: GuildMember | PartialGuildMember, kind: GreetingKind) => {
	const { greetings } = (await useClient().getGuildData(member.guild.id)).plugins;
	const message = greetings[kind];
	if (!message.enabled || !message.blocks.length) return;

	const payload = buildGreeting(member, message, kind);

	try {
		if (kind === "dm") {
			await member.send(payload);
			return;
		}

		const channel = message.channel ? await member.guild.channels.fetch(message.channel).catch(() => null) : null;
		if (channel?.isSendable()) await channel.send(payload);
	} catch (error) {
		// Closed DMs and missing channel permissions are common, they shouldn't be loud
		logger.warn(`[Greetings] Can't send the ${kind} message in ${member.guild.id}:`, (error as Error).message);
	}
};

export const giveAutoroles = async (member: GuildMember) => {
	const { autoroles } = (await useClient().getGuildData(member.guild.id)).plugins.greetings;
	const roles = autoroles.filter(id => member.guild.roles.cache.get(id)?.editable && !member.roles.cache.has(id));
	if (!roles.length) return;

	await member.roles.add(roles, "Autorole").catch(error => {
		logger.warn(`[Greetings] Can't give autoroles in ${member.guild.id}:`, error.message);
	});
};
