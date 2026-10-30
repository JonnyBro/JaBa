import useClient from "@/utils/use-client.js";
import { PermissionsBitField } from "discord.js";
import { FastifyReply, FastifyRequest } from "fastify";

export const send = <T>(reply: FastifyReply, data: T, code = 200) => reply.status(code).send({ code, data });

export const fail = (reply: FastifyReply, code: number, message: string) => reply.status(code).send({ code, message });

export const avatarUrl = (id: string, avatar: string | null) =>
	avatar
		? `https://cdn.discordapp.com/avatars/${id}/${avatar}.${avatar.startsWith("a_") ? "gif" : "png"}?size=128`
		: `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(id) >> 22n) % 6n)}.png`;

export const isOwner = (userId?: string) => !!userId && userId === useClient().configService.get<string>("OWNER");

export const canManage = (permissions: string | bigint) =>
	new PermissionsBitField(BigInt(permissions)).has(PermissionsBitField.Flags.ManageGuild);

export const safeRedirect = (redirect?: string) =>
	redirect && redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "/servers";

export const requireUser = async (req: FastifyRequest, reply: FastifyReply) => {
	if (!req.session.user) return fail(reply, 401, "Not signed in");
};
