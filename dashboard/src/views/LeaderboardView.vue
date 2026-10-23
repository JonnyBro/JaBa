<script setup lang="ts">
import { getRepLeaderboard } from "@/api";
import EmptyState from "@/components/common/EmptyState.vue";
import ErrorState from "@/components/common/ErrorState.vue";
import PositionBadge from "@/components/common/PositionBadge.vue";
import SectionTitle from "@/components/common/SectionTitle.vue";
import UserAvatar from "@/components/common/UserAvatar.vue";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/composables/useAuth";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/vue-query";

const { me } = useAuth();
const leaderboard = useQuery({ queryKey: ["leaderboard", "rep"], queryFn: getRepLeaderboard });
</script>

<template>
	<section class="space-y-4">
		<SectionTitle :title="$t('leaderboard.title')" :subtitle="$t('leaderboard.subtitle')" />

		<ErrorState v-if="leaderboard.isError.value" :error="leaderboard.error.value" @retry="leaderboard.refetch()" />
		<div v-else-if="leaderboard.isPending.value" class="space-y-2">
			<Skeleton v-for="i in 10" :key="i" class="h-12 w-full" />
		</div>
		<EmptyState v-else-if="!leaderboard.data.value?.length" :title="$t('leaderboard.empty')" />

		<ol v-else class="panel divide-y">
			<li
				v-for="entry in leaderboard.data.value"
				:key="entry.id"
				:class="cn('flex items-center gap-3 px-3 py-2', entry.id === me?.id && 'bg-hl/10')"
			>
				<PositionBadge :position="entry.position" class="w-10" />
				<UserAvatar :name="entry.displayName" :src="entry.avatar" class="size-8" />
				<span class="min-w-0 flex-1 truncate">{{ entry.displayName }}</span>
				<span class="font-display text-lg">{{ formatNumber(entry.rep) }}</span>
			</li>
		</ol>
	</section>
</template>
