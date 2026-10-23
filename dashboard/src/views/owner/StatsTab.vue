<script setup lang="ts">
import { getCommandStats } from "@/api";
import EmptyState from "@/components/common/EmptyState.vue";
import ErrorState from "@/components/common/ErrorState.vue";
import Hint from "@/components/common/Hint.vue";
import StatTile from "@/components/common/StatTile.vue";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatNumber } from "@/lib/format";
import { keepPreviousData, useQuery } from "@tanstack/vue-query";
import { computed, ref } from "vue";

const RANGES = [7, 30, 90];

const days = ref(30);
const stats = useQuery({
	queryKey: ["owner", "stats", days],
	queryFn: () => getCommandStats(days.value),
	placeholderData: keepPreviousData,
});

const dailyMax = computed(() => Math.max(1, ...(stats.data.value?.daily.map(d => d.count) ?? [])));
const topMax = computed(() => Math.max(1, stats.data.value?.commands[0]?.count ?? 0));
const average = computed(() => (stats.data.value ? Math.round(stats.data.value.total / stats.data.value.days) : 0));

// Days are UTC dates, noon keeps them on the same date in every timezone
const dayLabel = (day: string) => formatDate(new Date(`${day}T12:00:00Z`).getTime());
</script>

<template>
	<div class="space-y-6">
		<div class="flex gap-2">
			<Button
				v-for="range in RANGES"
				:key="range"
				size="sm"
				:variant="days === range ? 'default' : 'outline'"
				@click="days = range"
			>
				{{ $t("owner.stats.days", { n: range }) }}
			</Button>
		</div>

		<ErrorState v-if="stats.isError.value" :error="stats.error.value" @retry="stats.refetch()" />
		<Skeleton v-else-if="stats.isPending.value" class="h-64" />

		<template v-else-if="stats.data.value">
			<div class="grid gap-4 sm:grid-cols-3" :class="stats.isPlaceholderData.value && 'opacity-60'">
				<StatTile :label="$t('owner.stats.total')" :value="formatNumber(stats.data.value.total)" />
				<StatTile :label="$t('owner.stats.average')" :value="formatNumber(average)" />
				<StatTile
					:label="$t('owner.stats.top')"
					:value="stats.data.value.commands[0] ? `/${stats.data.value.commands[0].command}` : '—'"
				/>
			</div>

			<EmptyState
				v-if="!stats.data.value.total"
				:title="$t('owner.stats.empty')"
				:description="$t('owner.stats.emptyText')"
			/>

			<template v-else>
				<section class="hud-panel space-y-2 p-4">
					<div class="flex items-baseline justify-between">
						<h3 class="hud-title text-lg">{{ $t("owner.stats.perDay") }}</h3>
						<span class="font-hud text-sm text-muted-foreground">max {{ formatNumber(dailyMax) }}</span>
					</div>

					<div
						class="flex h-48 items-end gap-0.5 border-b border-border/60"
						role="img"
						:aria-label="$t('owner.stats.perDay')"
					>
						<Hint
							v-for="point in stats.data.value.daily"
							:key="point.day"
							:text="`${dayLabel(point.day)}: ${formatNumber(point.count)}`"
						>
							<!-- The whole column is the hover target, not just the bar -->
							<div class="group flex h-full min-w-0 flex-1 cursor-default items-end" tabindex="0">
								<div
									class="w-full bg-hl transition-opacity group-hover:opacity-80"
									:style="{
										height: `${(point.count / dailyMax) * 100}%`,
										minHeight: point.count ? '2px' : '0',
									}"
								/>
							</div>
						</Hint>
					</div>

					<div class="flex justify-between font-hud text-xs text-muted-foreground">
						<span>{{ dayLabel(stats.data.value.daily[0].day) }}</span>
						<span>{{ dayLabel(stats.data.value.daily[stats.data.value.daily.length - 1].day) }}</span>
					</div>
				</section>

				<section class="hud-panel space-y-3 p-4">
					<h3 class="hud-title text-lg">{{ $t("owner.stats.commands") }}</h3>
					<ol class="space-y-2">
						<li
							v-for="item in stats.data.value.commands"
							:key="item.command"
							class="grid grid-cols-[8rem_1fr_4rem] items-center gap-3"
						>
							<span class="truncate font-hud">/{{ item.command }}</span>
							<div class="hud-bar">
								<span class="bg-hl!" :style="{ width: `${(item.count / topMax) * 100}%` }" />
							</div>
							<span class="text-right font-hud tabular">{{ formatNumber(item.count) }}</span>
						</li>
					</ol>
				</section>
			</template>
		</template>
	</div>
</template>
