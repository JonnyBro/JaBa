<script setup lang="ts">
import ErrorState from "@/components/common/ErrorState.vue";
import UserAvatar from "@/components/common/UserAvatar.vue";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGuild } from "@/composables/useGuild";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-vue-next";
import { computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

const MANAGE_TABS = [
	{ name: "server", label: "server.tabs.settings" },
	{ name: "server-members", label: "server.tabs.members" },
	{ name: "server-tickets", label: "server.tabs.tickets" },
	{ name: "server-messages", label: "server.tabs.messages" },
	{ name: "server-audit", label: "server.tabs.audit" },
];
const MUSIC_TAB = { name: "server-music", label: "server.tabs.music" };
const LEADERBOARD_TAB = { name: "server-leaderboard", label: "server.tabs.leaderboard" };
const MEMBER_TABS = [MUSIC_TAB, LEADERBOARD_TAB];

const route = useRoute();
const router = useRouter();
const guild = useGuild();

const canManage = computed(() => Boolean(guild.data.value?.canManage));
const tabs = computed(() => (canManage.value ? [...MANAGE_TABS, ...MEMBER_TABS] : MEMBER_TABS));
const isMemberTab = computed(() => MEMBER_TABS.some(tab => tab.name === route.name));

// Members without Manage Server only get the music and the leaderboard, other tabs lead to the music
watch(
	() => guild.data.value,
	data => {
		if (data && !data.canManage && !isMemberTab.value)
			void router.replace({ name: MUSIC_TAB.name, params: { id: data.id } });
	},
	{ immediate: true },
);
</script>

<template>
	<div class="space-y-6">
		<Button as-child variant="ghost" size="sm" class="-ml-2">
			<RouterLink :to="{ name: 'servers' }">
				<ArrowLeft />
				{{ $t("server.back") }}
			</RouterLink>
		</Button>

		<ErrorState v-if="guild.isError.value" :error="guild.error.value" @retry="guild.refetch()" />

		<Skeleton v-else-if="guild.isPending.value" class="h-24" />

		<template v-else-if="guild.data.value">
			<section class="panel panel-accent flex items-center gap-4 p-4">
				<UserAvatar :name="guild.data.value.name" :src="guild.data.value.icon" class="size-16" />
				<div class="min-w-0">
					<h1 class="truncate font-display text-3xl">{{ guild.data.value.name }}</h1>
					<p class="text-muted-foreground">
						{{ $t("server.members", { n: formatNumber(guild.data.value.memberCount) }) }}
					</p>
				</div>
			</section>

			<nav class="flex gap-1 overflow-x-auto border-b">
				<RouterLink
					v-for="tab in tabs"
					:key="tab.name"
					:to="{ name: tab.name, params: { id: guild.id.value } }"
					:class="
						cn(
							'-mb-px shrink-0 border-b-2 border-transparent px-3 py-2 font-display text-sm  text-muted-foreground transition-colors hover:text-hl',
							route.name === tab.name && 'border-hl text-foreground',
						)
					"
				>
					{{ $t(tab.label) }}
				</RouterLink>
			</nav>

			<RouterView v-if="canManage || isMemberTab" :guild="guild.data.value" />
		</template>
	</div>
</template>
