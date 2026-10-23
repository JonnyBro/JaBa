import { musicSocketUrl } from "@/api";
import type { MusicState } from "@/api/types";
import { useNow } from "@vueuse/core";
import { computed, onBeforeUnmount, onMounted, ref, type Ref } from "vue";

const MAX_RETRY_DELAY = 15_000;

export const useMusic = (guildId: Ref<string>) => {
	const state = ref<MusicState | null>(null);
	const connected = ref(false);
	const receivedAt = ref(0);

	let socket: WebSocket | null = null;
	let retries = 0;
	let retryTimer: ReturnType<typeof setTimeout> | undefined;
	let stopped = false;

	const connect = () => {
		socket = new WebSocket(musicSocketUrl(guildId.value));

		socket.onopen = () => {
			connected.value = true;
			retries = 0;
		};

		socket.onmessage = event => {
			const message = JSON.parse(String(event.data)) as { type: string; data: MusicState };
			if (message.type !== "state") return;

			state.value = message.data;
			// Local time on purpose, the browser clock can be off from the server one
			receivedAt.value = Date.now();
		};

		socket.onclose = () => {
			connected.value = false;
			if (stopped) return;

			retryTimer = setTimeout(connect, Math.min(MAX_RETRY_DELAY, 1000 * 2 ** retries++));
		};
	};

	onMounted(connect);

	onBeforeUnmount(() => {
		stopped = true;
		clearTimeout(retryTimer);
		socket?.close();
	});

	const now = useNow({ interval: 500 });

	/** Lavalink only reports the position every few seconds, in between it is counted here */
	const position = computed(() => {
		const current = state.value;
		if (!current?.active) return 0;
		if (current.paused || current.current.isStream) return current.position;

		return Math.min(current.position + (now.value.getTime() - receivedAt.value), current.current.duration);
	});

	return { state, connected, position };
};
