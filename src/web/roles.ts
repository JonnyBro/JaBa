import { Guild } from "discord.js";

/** Roles the bot can hand out, the same check Discord does when the bot adds one */
export const getAssignableRoles = (guild: Guild) =>
	guild.roles.cache
		.filter(role => role.id !== guild.id && !role.managed && role.editable)
		.sort((a, b) => b.position - a.position)
		.map(role => ({ id: role.id, name: role.name, color: role.hexColor }));
