<script setup lang="ts">
import { getGuildProfile, getProfile } from "@/api";
import type { GuildInfo } from "@/api/types";
import EmptyState from "@/components/common/EmptyState.vue";
import ErrorState from "@/components/common/ErrorState.vue";
import SectionTitle from "@/components/common/SectionTitle.vue";
import StatTile from "@/components/common/StatTile.vue";
import UserAvatar from "@/components/common/UserAvatar.vue";
import ProfileEditor from "@/components/profile/ProfileEditor.vue";
import { Skeleton } from "@/components/ui/skeleton";
import { currentLocale } from "@/i18n";
import { formatDate, formatDateTime, formatNumber, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/vue-query";
import { computed } from "vue";

const COOLDOWNS = ["daily", "work", "rob"] as const;

const props = defineProps<{ guild: GuildInfo }>();

const guildProfile = useQuery({
	queryKey: ["guild", props.guild.id, "me"],
	queryFn: () => getGuildProfile(props.guild.id),
});
const profile = useQuery({ queryKey: ["profile"], queryFn: getProfile });

const data = computed(() => guildProfile.data.value);
const levelShare = computed(() => (data.value ? Math.min(data.value.exp / data.value.nextLevelExp, 1) : 0));

// Others see only the day and month when the year is hidden, so the owner sees the same here
const birthdate = computed(() => {
	const user = profile.data.value;
	if (!user?.birthdate) return null;
	if (!user.hideAge) return formatDate(user.birthdate);

	return new Intl.DateTimeFormat(currentLocale.value, { day: "numeric", month: "long" }).format(user.birthdate);
});

const isReady = (until: number) => until <= Date.now();
</script>

<template>
	<ErrorState v-if="guildProfile.isError.value" :error="guildProfile.error.value" @retry="guildProfile.refetch()" />
	<Skeleton v-else-if="guildProfile.isPending.value" class="h-96" />

	<div v-else-if="data" class="space-y-8">
		<section class="hud-panel hud-edge flex items-center gap-4 p-4">
			<UserAvatar :name="data.displayName" :src="data.avatar" class="size-16" />
			<div class="min-w-0 space-y-1">
				<h2 class="truncate font-hud text-3xl">{{ data.displayName }}</h2>
				<p v-if="profile.data.value?.bio" class="text-sm whitespace-pre-line italic">
					{{ profile.data.value.bio }}
				</p>
				<p class="flex flex-wrap gap-x-4 text-sm text-muted-foreground">
					<span>{{ $t("myProfile.rep", { n: formatNumber(data.rep) }) }}</span>
					<span v-if="birthdate">{{ $t("myProfile.birthdate", { date: birthdate }) }}</span>
					<span v-if="data.joinedAt">{{ $t("myProfile.joined", { date: formatDate(data.joinedAt) }) }}</span>
				</p>
			</div>
		</section>

		<section class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
			<StatTile :label="$t('myProfile.wallet')" :value="formatNumber(data.money)" />
			<StatTile :label="$t('myProfile.bank')" :value="formatNumber(data.bank)" />
			<StatTile
				:label="$t('myProfile.creditsRank')"
				:value="data.ranks ? `#${data.ranks.credits}` : '-'"
				:hint="data.ranks ? $t('myProfile.ofTotal', { n: data.ranks.total }) : undefined"
			/>
			<StatTile
				:label="$t('myProfile.levelRank')"
				:value="data.ranks ? `#${data.ranks.level}` : '-'"
				:hint="data.ranks ? $t('myProfile.ofTotal', { n: data.ranks.total }) : undefined"
			/>
		</section>

		<section class="grid gap-4 lg:grid-cols-2">
			<div class="hud-panel space-y-3 p-4">
				<h3 class="hud-title text-lg">{{ $t("myProfile.level", { n: data.level }) }}</h3>
				<div class="h-2 overflow-hidden rounded-full bg-muted">
					<div class="h-full bg-hl" :style="{ width: `${levelShare * 100}%` }" />
				</div>
				<p class="text-sm text-muted-foreground">
					{{
						$t("myProfile.exp", {
							exp: formatNumber(data.exp),
							next: formatNumber(data.nextLevelExp),
						})
					}}
				</p>
			</div>

			<div class="hud-panel space-y-2 p-4">
				<h3 class="hud-title text-lg">{{ $t("myProfile.cooldowns") }}</h3>
				<p v-for="name in COOLDOWNS" :key="name" class="flex justify-between gap-2 text-sm">
					<span>{{ $t(`myProfile.cooldown.${name}`) }}</span>
					<span :class="cn(isReady(data.cooldowns[name]) ? 'text-emerald-500' : 'text-muted-foreground')">
						{{
							isReady(data.cooldowns[name]) ? $t("myProfile.ready") : formatRelative(data.cooldowns[name])
						}}
					</span>
				</p>
				<p class="text-sm text-muted-foreground">{{ $t("myProfile.streak", { n: data.dailyStreak }) }}</p>
			</div>
		</section>

		<section class="space-y-4">
			<SectionTitle :title="$t('myProfile.inventory')" />
			<EmptyState v-if="!data.inventory.length && !data.effects.length" :title="$t('myProfile.inventoryEmpty')" />
			<div v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				<div v-for="effect in data.effects" :key="effect.effect" class="hud-panel space-y-1 p-3">
					<p class="font-medium">{{ $t(`shop.effects.${effect.effect}`) }}</p>
					<p class="text-sm text-muted-foreground">
						{{ $t("myProfile.effectUntil", { time: formatRelative(effect.until) }) }}
					</p>
				</div>
				<div v-for="item in data.inventory" :key="item.id" class="hud-panel space-y-1 p-3">
					<p class="flex items-center justify-between gap-2 font-medium">
						<span class="truncate">{{ item.emoji }} {{ item.name }}</span>
						<span v-if="item.quantity > 1" class="shrink-0 text-muted-foreground"
							>x{{ item.quantity }}</span
						>
					</p>
					<p v-if="item.description" class="line-clamp-2 text-sm text-muted-foreground">
						{{ item.description }}
					</p>
				</div>
			</div>
		</section>

		<section class="grid gap-4 lg:grid-cols-2">
			<div class="space-y-4">
				<SectionTitle :title="$t('myProfile.transactions')" />
				<EmptyState v-if="!data.transactions.length" :title="$t('myProfile.transactionsEmpty')" />
				<ul v-else class="hud-panel divide-y">
					<li
						v-for="(entry, i) in data.transactions"
						:key="i"
						class="flex items-center justify-between gap-3 px-3 py-2 text-sm"
					>
						<div class="min-w-0">
							<p class="truncate">{{ entry.user }}</p>
							<p class="text-xs text-muted-foreground">{{ formatDateTime(entry.date) }}</p>
						</div>
						<span
							:class="
								cn('shrink-0 font-hud', entry.type === 'got' ? 'text-emerald-500' : 'text-destructive')
							"
						>
							{{ entry.type === "got" ? "+" : "−" }}{{ formatNumber(entry.amount) }}
						</span>
					</li>
				</ul>
			</div>

			<div class="space-y-4">
				<SectionTitle :title="$t('myProfile.warns')" />
				<EmptyState v-if="!data.warns.length" :title="$t('myProfile.warnsEmpty')" />
				<ul v-else class="hud-panel divide-y">
					<li v-for="warn in data.warns" :key="warn.id" class="space-y-0.5 px-3 py-2 text-sm">
						<p>{{ warn.reason || $t("myProfile.noReason") }}</p>
						<p class="text-xs text-muted-foreground">
							#{{ warn.id }} · {{ formatDateTime(warn.createdAt) }}
						</p>
					</li>
				</ul>
			</div>
		</section>

		<section class="space-y-4">
			<SectionTitle :title="$t('myProfile.shared')" :subtitle="$t('myProfile.sharedHint')" />
			<ProfileEditor />
		</section>
	</div>
</template>
