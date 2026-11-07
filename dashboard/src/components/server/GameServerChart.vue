<script setup lang="ts">
import { getGameServerHistory } from "@/api";
import { GAME_SERVER_RANGES, type GameServerRange } from "@/api/types";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/vue-query";
import { computed, ref } from "vue";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const REFRESH_INTERVAL = 60_000;

// Same buckets as the bot, see game-server-history.ts
const RANGES: Record<GameServerRange, { span: number; bucket: number }> = {
	day: { span: 24 * HOUR, bucket: 10 * MINUTE },
	week: { span: 7 * 24 * HOUR, bucket: HOUR },
};

const WIDTH = 600;
const HEIGHT = 120;
const OFFLINE_BAR = 4;
const PLOT_BOTTOM = HEIGHT - OFFLINE_BAR - 4;

const props = defineProps<{ guildId: string; serverId: string }>();

const range = ref<GameServerRange>("day");

const history = useQuery({
	queryKey: computed(() => ["guild", props.guildId, "gameservers", props.serverId, "history", range.value]),
	queryFn: () => getGameServerHistory(props.guildId, props.serverId, range.value),
	refetchInterval: REFRESH_INTERVAL,
});

const chart = computed(() => {
	const points = history.data.value?.points ?? [];
	const { span, bucket } = RANGES[range.value];
	const slots = span / bucket;
	const start = Math.floor(Date.now() / bucket) * bucket - span + bucket;
	const step = WIDTH / (slots - 1);

	const peak = Math.max(0, ...points.map(p => p.players ?? 0));
	const top = Math.max(1, peak) * 1.15;
	const x = (t: number) => ((t - start) / bucket) * step;
	const y = (players: number) => PLOT_BOTTOM - (players / top) * (PLOT_BOTTOM - 4);

	// A gap in the checks or an offline bucket breaks the line
	const runs: { x: number; y: number }[][] = [];
	let previous: number | null = null;
	for (const point of points) {
		if (point.players === null) {
			previous = null;
			continue;
		}

		if (previous === null || point.t - previous > bucket) runs.push([]);
		runs.at(-1)!.push({ x: x(point.t), y: y(point.players) });
		previous = point.t;
	}

	return {
		start,
		bucket,
		slots,
		step,
		peak,
		peakY: y(peak),
		online: points.some(p => p.players !== null),
		// A lone point gets a bucket wide so it's still visible
		lines: runs.map(run => (run.length > 1 ? run : [run[0], { x: run[0].x + step * 0.8, y: run[0].y }])),
		offline: points.filter(p => p.players === null).map(p => x(p.t) - step / 2),
	};
});

const linePoints = (line: { x: number; y: number }[]) => line.map(p => `${p.x},${p.y}`).join(" ");

const areaPoints = (line: { x: number; y: number }[]) =>
	`${line[0].x},${PLOT_BOTTOM} ${linePoints(line)} ${line.at(-1)!.x},${PLOT_BOTTOM}`;

const hovered = ref<number | null>(null);

const onMove = (event: PointerEvent) => {
	const box = (event.currentTarget as SVGElement).getBoundingClientRect();
	const slot = Math.round(((event.clientX - box.left) / box.width) * (chart.value.slots - 1));
	hovered.value = chart.value.start + Math.min(Math.max(slot, 0), chart.value.slots - 1) * chart.value.bucket;
};

const hoveredPoint = computed(() =>
	hovered.value === null ? null : history.data.value?.points.find(p => p.t === hovered.value),
);
</script>

<template>
	<div class="space-y-1.5">
		<div class="flex items-center justify-between gap-2 text-xs text-muted-foreground">
			<span v-if="hovered !== null">
				{{ formatDateTime(hovered) }} ·
				<template v-if="!hoveredPoint">{{ $t("gameservers.chart.noData") }}</template>
				<template v-else-if="hoveredPoint.players === null">{{ $t("gameservers.chart.offline") }}</template>
				<template v-else>{{ $t("gameservers.chart.players", { count: hoveredPoint.players }) }}</template>
			</span>
			<span v-else-if="chart.online">{{ $t("gameservers.chart.peak", { count: chart.peak }) }}</span>
			<span v-else />

			<div class="flex gap-1">
				<button
					v-for="item in GAME_SERVER_RANGES"
					:key="item"
					type="button"
					:class="cn('rounded px-1.5 py-0.5', range === item ? 'bg-hl/15 text-hl' : 'hover:text-foreground')"
					@click="range = item"
				>
					{{ $t(`gameservers.chart.${item}`) }}
				</button>
			</div>
		</div>

		<svg
			v-if="chart.online"
			:viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
			preserveAspectRatio="none"
			class="h-20 w-full touch-none"
			@pointermove="onMove"
			@pointerleave="hovered = null"
		>
			<line
				v-if="chart.peak > 0"
				x1="0"
				:x2="WIDTH"
				:y1="chart.peakY"
				:y2="chart.peakY"
				class="stroke-muted-foreground/30"
				stroke-dasharray="4 4"
				vector-effect="non-scaling-stroke"
			/>
			<line
				x1="0"
				:x2="WIDTH"
				:y1="PLOT_BOTTOM"
				:y2="PLOT_BOTTOM"
				class="stroke-muted-foreground/30"
				vector-effect="non-scaling-stroke"
			/>
			<template v-for="(line, i) in chart.lines" :key="i">
				<polygon :points="areaPoints(line)" class="fill-green-500/15" />
				<polyline
					:points="linePoints(line)"
					fill="none"
					class="stroke-green-500"
					stroke-width="2"
					stroke-linejoin="round"
					vector-effect="non-scaling-stroke"
				/>
			</template>
			<rect
				v-for="x in chart.offline"
				:key="x"
				:x="x"
				:y="HEIGHT - OFFLINE_BAR"
				:width="chart.step"
				:height="OFFLINE_BAR"
				class="fill-red-500/80"
			/>
			<line
				v-if="hovered !== null"
				:x1="((hovered - chart.start) / chart.bucket) * chart.step"
				:x2="((hovered - chart.start) / chart.bucket) * chart.step"
				y1="0"
				:y2="HEIGHT"
				class="stroke-foreground/40"
				vector-effect="non-scaling-stroke"
			/>
		</svg>
		<p v-else-if="!history.isPending.value" class="py-6 text-center text-xs text-muted-foreground">
			{{ $t("gameservers.chart.empty") }}
		</p>
	</div>
</template>
