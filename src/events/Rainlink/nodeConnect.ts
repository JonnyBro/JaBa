import logger from "@/helpers/logger.js";
import { RainlinkNode } from "rainlink";

export const data = {
	name: "nodeConnect",
	player: true,
	once: false,
};

export async function run(node: RainlinkNode) {
	logger.ready(`Lavalink node ${node.options.name}: Ready!`);

	/* TODO: Needs proper implementation
	const guildsData = await client.getGuildsData();
	const reconnects = guildsData.filter(d => d.reconnect.status);

	reconnects.forEach(async (guildData, i) => {
		setTimeout(async () => {
			const guild = client.guilds.cache.get(guildData.id);
			const text = client.channels.cache.get(guildData.reconnect.text!);
			const voice = client.channels.cache.get(guildData.reconnect.voice!);
			const status = guildData.reconnect.status;
			const queue = guildData.reconnect.queue;

			if (!guild || !status || !text || !voice || queue.length <= 0) return;

			const player = await client.rainlink.create({
				guildId: guild.id,
				textId: text.id,
				voiceId: voice.id,
				volume: 100,
				shardId: guild.shardId,
				deaf: true,
			});

			for (const track of queue) player.queue.add(track);

			await player.play();

			guildData.set("reconnect", {
				status: false,
				text: null,
				voice: null,
				queue: [],
			});

			await guildData.save();
		}, i * 2500);
	}); */
}
