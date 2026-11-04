import { ExtendedClient } from "@/structures/client.js";
import { GatewayIntentBits, MessageMentionOptions, Partials, PermissionsBitField } from "discord.js";
import { AsyncLocalStorage } from "node:async_hooks";
import path from "node:path";

export const IS_PROD = process.env.NODE_ENV === "production";

export const PROJECT_ROOT = path.join(import.meta.dirname, "..");
export const CLIENT_INTENTS = [
	GatewayIntentBits.Guilds,
	GatewayIntentBits.GuildMembers,
	GatewayIntentBits.GuildVoiceStates,
	GatewayIntentBits.GuildMessages,
	GatewayIntentBits.MessageContent,
];
export const CLIENT_PARTIALS: Array<Partials> = [Partials.GuildMember];

export const BOT_PERMISSIONS = [
	PermissionsBitField.Flags.ViewChannel,
	PermissionsBitField.Flags.SendMessages,
	PermissionsBitField.Flags.SendMessagesInThreads,
	PermissionsBitField.Flags.EmbedLinks,
	PermissionsBitField.Flags.AttachFiles,
	PermissionsBitField.Flags.ReadMessageHistory,
	PermissionsBitField.Flags.AddReactions,
	PermissionsBitField.Flags.UseExternalEmojis,
	PermissionsBitField.Flags.MentionEveryone,
	PermissionsBitField.Flags.ManageMessages,
	PermissionsBitField.Flags.CreatePrivateThreads,
	PermissionsBitField.Flags.ManageThreads,
	PermissionsBitField.Flags.ManageRoles,
	PermissionsBitField.Flags.CreateGuildExpressions,
	PermissionsBitField.Flags.Connect,
	PermissionsBitField.Flags.Speak,
	PermissionsBitField.Flags.KickMembers,
	PermissionsBitField.Flags.BanMembers,
	PermissionsBitField.Flags.ModerateMembers,
];
export const CLIENT_ALLOWED_MENTIONS: MessageMentionOptions = {
	parse: ["everyone", "roles", "users"],
};
export const SUPER_CONTEXT = new AsyncLocalStorage<ExtendedClient>();
