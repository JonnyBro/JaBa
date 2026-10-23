<script setup lang="ts">
import { getGuildLeaderboard } from "@/api";
import type { GuildInfo, GuildLeaderboardType } from "@/api/types";
import EmptyState from "@/components/common/EmptyState.vue";
import ErrorState from "@/components/common/ErrorState.vue";
import PositionBadge from "@/components/common/PositionBadge.vue";
import UserAvatar from "@/components/common/UserAvatar.vue";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/composables/useAuth";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/vue-query";
import { ref } from "vue";

const TYPES: GuildLeaderboardType[] = ["credits", "level"];

const props = defineProps<{ guild: GuildInfo }>();

const { me } = useAuth();
const type = ref<GuildLeaderboardType>("credits");
const leaderboard = useQuery({
	queryKey: ["guild", props.guild.id, "leaderboard", type],
	queryFn: () => getGuildLeaderboard(props.guild.id, type.value),
});
</script>

<template>
	<div class="space-y-4">
		<div class="flex gap-2">
			<Button
				v-for="t in TYPES"
				:key="t"
				:variant="type === t ? 'default' : 'outline'"
				size="sm"
				@click="type = t"
			>
				{{ $t(`leaderboard.${t}`) }}
			</Button>
		</div>

		<ErrorState v-if="leaderboard.isError.value" :error="leaderboard.error.value" @retry="leaderboard.refetch()" />
		<div v-else-if="leaderboard.isPending.value" class="space-y-2">
			<Skeleton v-for="i in 8" :key="i" class="h-12 w-full" />
		</div>
		<EmptyState v-else-if="!leaderboard.data.value?.items.length" :title="$t('leaderboard.empty')" />

		<ol v-else class="hud-panel divide-y">
			<li
				v-for="entry in leaderboard.data.value.items"
				:key="entry.id"
				:class="cn('flex items-center gap-3 px-3 py-2', entry.id === me?.id && 'bg-hl/10')"
			>
				<PositionBadge :position="entry.position" class="w-10" />
				<UserAvatar :name="entry.displayName" :src="entry.avatar" class="size-8" />
				<span class="min-w-0 flex-1 truncate">{{ entry.displayName }}</span>

				<span v-if="type === 'credits'" class="font-hud text-lg">{{
					formatNumber(entry.money + entry.bank)
				}}</span>
				<div v-else class="w-40 space-y-1">
					<p class="flex justify-between font-hud text-sm">
						<span>{{ $t("leaderboard.levelShort", { n: entry.level }) }}</span>
						<span class="text-muted-foreground">{{ entry.exp }} / {{ entry.nextLevelExp }}</span>
					</p>
					<div class="hud-bar">
						<span :style="{ width: `${Math.min(100, (entry.exp / entry.nextLevelExp) * 100)}%` }" />
					</div>
				</div>
			</li>
		</ol>
	</div>
</template>
