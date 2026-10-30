import {
	getCategoryFromPath,
	getCommandType,
	getDescriptionKey,
	getLocaleNamespace,
	isContextCommand,
} from "@/helpers/commands.js";
import UserModel from "@/models/UserModel.js";
import useClient from "@/utils/use-client.js";
import { ApplicationCommandType, InteractionContextType } from "discord.js";
import { FastifyInstance } from "fastify";
import { send } from "../utils.js";

const LEADERBOARD_LIMIT = 50;
const LEADERBOARD_CACHE_MS = 60_000;

let repCache: { at: number; items: unknown[] } | null = null;

export default async function publicRoutes(fastify: FastifyInstance) {
	fastify.get("/api/commands", async (req, reply) => {
		const client = useClient();
		const requested = (req.query as { lang?: string }).lang;
		const lng = client.i18n.SupportedLanguages.find(l => l === requested || l.split("-")[0] === requested);
		const t = (key: string) => client.i18n.translate(key, { lng });

		const commands = client.commands
			.filter(cmd => !cmd.options?.devOnly)
			.map(cmd => {
				const namespace = getLocaleNamespace(cmd);
				const context = isContextCommand(cmd);

				return {
					name: cmd.data.name,
					displayName: context ? t(`${namespace}:CONTEXT_NAME`) : `/${cmd.data.name}`,
					category: getCategoryFromPath(cmd.filePath),
					description: t(getDescriptionKey(cmd)),
					type: context
						? getCommandType(cmd) === ApplicationCommandType.User
							? "user"
							: "message"
						: "slash",
					guildOnly: !!cmd.data.contexts?.every(c => c === InteractionContextType.Guild),
					usage: context ? "" : t(`${namespace}:USAGE`),
					examples: context ? "" : t(`${namespace}:EXAMPLES`),
				};
			})
			.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

		return send(reply, commands);
	});

	fastify.get("/api/leaderboard/rep", async (_req, reply) => {
		if (repCache && Date.now() - repCache.at < LEADERBOARD_CACHE_MS) return send(reply, repCache.items);

		const client = useClient();
		const docs = await UserModel.find({ rep: { $gt: 0 } })
			.sort({ rep: -1 })
			.limit(LEADERBOARD_LIMIT)
			.lean();

		const items = await Promise.all(
			docs.map(async (doc, i) => {
				const user = await client.users.fetch(doc.id).catch(() => null);

				return {
					position: i + 1,
					id: doc.id,
					displayName: user?.globalName ?? user?.username ?? doc.id,
					avatar: user?.displayAvatarURL({ size: 64 }) ?? null,
					rep: doc.rep,
				};
			}),
		);

		repCache = { at: Date.now(), items };

		return send(reply, items);
	});
}
