import logger from "@/helpers/logger.js";
import { RainlinkPlayerCustom } from "@/types.js";
import useClient from "@/utils/use-client.js";

const client = useClient();
const debug = !client.configService.get("production");

export const data = {
	name: "playerDestroy",
	player: true,
};

export async function run(player: RainlinkPlayerCustom) {
	if (!player) return;

	const guild = client.guilds.cache.get(player.guildId);
	if (!guild) return;

	if (player.message) await player.message.delete().catch(() => {});

	const guildData = await client.getGuildData(player.guildId);
	const tracks = player.queue.map(t => t);

	if (!player.textId || !player.voiceId || tracks.length === 0) return;

	guildData.set("reconnect", {
		status: true,
		text: player.textId,
		voice: player.voiceId,
		queue: tracks,
	});

	await guildData.save();

	if (debug) {
		logger.debug(
			`Player destroyed in ${guild.name} (${guild.id})! Queue has been saved for reconnect`,
		);
	}
}
