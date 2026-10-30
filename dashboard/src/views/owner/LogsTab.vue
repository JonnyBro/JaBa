<script setup lang="ts">
import { ownerLogsSocketUrl } from "@/api";
import type { LogLine } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Pause, Play, Trash2 } from "@lucide/vue";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

const MAX_LINES = 1000;
const LEVELS = ["ERROR", "WARN", "INFO", "READY", "LOG", "CMD", "DEBUG"];

const levelColor: Record<string, string> = {
	ERROR: "text-destructive-foreground",
	WARN: "text-gold",
	READY: "text-hl",
};

const lines = ref<LogLine[]>([]);
const connected = ref(false);
const paused = ref(false);
const search = ref("");
const hidden = ref(new Set<string>());
const container = ref<HTMLElement>();

let socket: WebSocket | null = null;
let stopped = false;
let retryTimer: ReturnType<typeof setTimeout> | undefined;

const push = (incoming: LogLine[]) => {
	if (paused.value) return;
	lines.value = [...lines.value, ...incoming].slice(-MAX_LINES);
};

const connect = () => {
	socket = new WebSocket(ownerLogsSocketUrl());
	socket.onopen = () => (connected.value = true);
	socket.onmessage = event => {
		const message = JSON.parse(String(event.data)) as { type: string; data: LogLine | LogLine[] };
		if (message.type === "history") lines.value = message.data as LogLine[];
		if (message.type === "line") push([message.data as LogLine]);
	};
	socket.onclose = () => {
		connected.value = false;
		if (!stopped) retryTimer = setTimeout(connect, 3000);
	};
};

onMounted(connect);
onBeforeUnmount(() => {
	stopped = true;
	clearTimeout(retryTimer);
	socket?.close();
});

const visible = computed(() => {
	const q = search.value.trim().toLowerCase();
	return lines.value.filter(l => !hidden.value.has(l.level) && (!q || l.text.toLowerCase().includes(q)));
});

const toggleLevel = (level: string) => {
	const next = new Set(hidden.value);
	if (next.has(level)) next.delete(level);
	else next.add(level);
	hidden.value = next;
};

watch(visible, async () => {
	const el = container.value;
	if (!el) return;

	const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
	await nextTick();
	if (atBottom) el.scrollTop = el.scrollHeight;
});

const time = (ms: number) => new Date(ms).toLocaleTimeString();
</script>

<template>
	<div class="space-y-3">
		<div class="flex flex-wrap items-center gap-2">
			<Input v-model="search" :placeholder="$t('owner.logs.search')" class="max-w-xs" />
			<Button
				v-for="level in LEVELS"
				:key="level"
				size="sm"
				:variant="hidden.has(level) ? 'ghost' : 'outline'"
				:class="cn('font-hud', hidden.has(level) && 'line-through opacity-60')"
				@click="toggleLevel(level)"
			>
				{{ level }}
			</Button>
			<div class="ml-auto flex items-center gap-2">
				<span class="flex items-center gap-1.5 font-hud text-sm text-muted-foreground">
					<span :class="cn('size-2 rounded-full', connected ? 'bg-hl' : 'bg-muted-foreground')" />
					{{ connected ? $t("owner.logs.live") : $t("owner.logs.offline") }}
				</span>
				<Button variant="outline" size="sm" @click="paused = !paused">
					<Play v-if="paused" />
					<Pause v-else />
					{{ paused ? $t("owner.logs.resume") : $t("owner.logs.pause") }}
				</Button>
				<Button variant="ghost" size="icon-sm" :aria-label="$t('owner.logs.clear')" @click="lines = []">
					<Trash2 />
				</Button>
			</div>
		</div>

		<div ref="container" class="hud-panel h-[60vh] overflow-y-auto p-3 font-mono text-xs leading-relaxed">
			<p v-if="!visible.length" class="text-muted-foreground">{{ $t("owner.logs.empty") }}</p>
			<p v-for="(line, i) in visible" :key="i" class="wrap-break-word whitespace-pre-wrap">
				<span class="text-muted-foreground">{{ time(line.time) }}</span>
				{{ " " }}
				<span :class="cn('font-bold', levelColor[line.level])">{{ line.level }}</span>
				{{ " " }}{{ line.text }}
			</p>
		</div>
	</div>
</template>
