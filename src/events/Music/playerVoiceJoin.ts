import { checkEmptyChannel } from "@/helpers/music.js";
import { Player } from "lavalink-client";

export const data = {
	name: "playerVoiceJoin",
	player: true,
	once: false,
};

export async function run(player: Player) {
	checkEmptyChannel(player);
}
