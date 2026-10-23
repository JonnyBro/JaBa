import { Guild } from "discord.js";

const MEMBERS_REFETCH_MS = 5 * 60_000;

const lastMembersFetch = new Map<string, number>();

/** A full member list is a gateway request, so it is only refreshed every few minutes */
export const ensureMembers = async (guild: Guild) => {
	if (Date.now() - (lastMembersFetch.get(guild.id) ?? 0) < MEMBERS_REFETCH_MS) return;

	lastMembersFetch.set(guild.id, Date.now());
	await guild.members.fetch();
};
