import { EventEmitter } from "node:events";

/** Fired whenever the player of a guild changes in a way the dashboard should show */
export const musicEvents = new EventEmitter<{ change: [guildId: string] }>();

export const notifyMusicChange = (guildId: string) => musicEvents.emit("change", guildId);

// lavalink-client looks for these methods on the prototype, so a plain object with functions is rejected
export class QueueChangesNotifier {
	tracksAdd(guildId: string) {
		notifyMusicChange(guildId);
	}

	tracksRemoved(guildId: string) {
		notifyMusicChange(guildId);
	}

	shuffled(guildId: string) {
		notifyMusicChange(guildId);
	}
}
