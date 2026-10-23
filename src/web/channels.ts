import { Guild, PermissionResolvable, PermissionsBitField } from "discord.js";

/** A text channel of the guild where the bot has every listed permission */
export const getSendableChannel = (guild: Guild, channelId: unknown, extra: PermissionResolvable[] = []) => {
	const channel = typeof channelId === "string" ? guild.channels.cache.get(channelId) : null;
	if (!channel?.isTextBased() || !channel.isSendable() || !guild.members.me) return null;

	const required = [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, ...extra];

	return channel.permissionsFor(guild.members.me).has(required) ? channel : null;
};
