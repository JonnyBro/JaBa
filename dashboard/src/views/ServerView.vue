<script setup lang="ts">
import ErrorState from "@/components/common/ErrorState.vue";
import UserAvatar from "@/components/common/UserAvatar.vue";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGuild } from "@/composables/useGuild";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
	ArrowLeft,
	Gift,
	Hand,
	History,
	MessageSquare,
	Music,
	ScrollText,
	ShieldAlert,
	Settings,
	ShoppingBag,
	Ticket,
	TrendingUp,
	Trophy,
	TriangleAlert,
	Users,
} from "@lucide/vue";
import { type Component, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

type Tab = { name: string; label: string; icon: Component };
type TabGroup = { label: string; tabs: Tab[] };

const MANAGE_GROUPS: TabGroup[] = [
	{
		label: "server.groups.general",
		tabs: [
			{ name: "server", label: "server.tabs.settings", icon: Settings },
			{ name: "server-members", label: "server.tabs.members", icon: Users },
			{ name: "server-audit", label: "server.tabs.audit", icon: History },
		],
	},
	{
		label: "server.groups.moderation",
		tabs: [
			{ name: "server-warns", label: "server.tabs.warns", icon: TriangleAlert },
			{ name: "server-modlog", label: "server.tabs.modlog", icon: ScrollText },
			{ name: "server-honeypot", label: "server.tabs.honeypot", icon: ShieldAlert },
			{ name: "server-tickets", label: "server.tabs.tickets", icon: Ticket },
		],
	},
	{
		label: "server.groups.community",
		tabs: [
			{ name: "server-greetings", label: "server.tabs.greetings", icon: Hand },
			{ name: "server-levels", label: "server.tabs.levels", icon: TrendingUp },
			{ name: "server-shop", label: "server.tabs.shop", icon: ShoppingBag },
			{ name: "server-giveaways", label: "server.tabs.giveaways", icon: Gift },
			{ name: "server-messages", label: "server.tabs.messages", icon: MessageSquare },
		],
	},
];
const MUSIC_TAB: Tab = { name: "server-music", label: "server.tabs.music", icon: Music };
const MEMBER_GROUP: TabGroup = {
	label: "server.groups.everyone",
	tabs: [MUSIC_TAB, { name: "server-leaderboard", label: "server.tabs.leaderboard", icon: Trophy }],
};

const route = useRoute();
const router = useRouter();
const guild = useGuild();

const canManage = computed(() => Boolean(guild.data.value?.canManage));
const groups = computed(() => (canManage.value ? [...MANAGE_GROUPS, MEMBER_GROUP] : [MEMBER_GROUP]));
const tabs = computed(() => groups.value.flatMap(group => group.tabs));
const isMemberTab = computed(() => MEMBER_GROUP.tabs.some(tab => tab.name === route.name));

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
			<section class="hud-panel hud-edge flex items-center gap-4 p-4">
				<UserAvatar :name="guild.data.value.name" :src="guild.data.value.icon" class="size-16" />
				<div class="min-w-0">
					<h1 class="truncate font-hud text-3xl">{{ guild.data.value.name }}</h1>
					<p class="text-muted-foreground">
						{{ $t("server.members", { n: formatNumber(guild.data.value.memberCount) }) }}
					</p>
				</div>
			</section>

			<div class="lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:items-start lg:gap-6">
				<nav class="flex gap-1 overflow-x-auto border-b lg:hidden">
					<RouterLink
						v-for="tab in tabs"
						:key="tab.name"
						:to="{ name: tab.name, params: { id: guild.id.value } }"
						:class="
							cn(
								'-mb-px shrink-0 border-b-2 border-transparent px-3 py-2 font-hud text-sm text-muted-foreground transition-colors hover:text-hl',
								route.name === tab.name && 'border-hl text-foreground',
							)
						"
					>
						{{ $t(tab.label) }}
					</RouterLink>
				</nav>

				<nav class="sticky top-20 hidden space-y-4 lg:block">
					<div v-for="group in groups" :key="group.label" class="space-y-1">
						<p class="px-3 text-xs tracking-wide text-muted-foreground uppercase">{{ $t(group.label) }}</p>
						<RouterLink
							v-for="tab in group.tabs"
							:key="tab.name"
							:to="{ name: tab.name, params: { id: guild.id.value } }"
							:class="
								cn(
									'flex items-center gap-2 border-l-2 border-transparent px-3 py-1.5 font-hud text-sm text-muted-foreground transition-colors hover:text-hl',
									route.name === tab.name && 'border-hl bg-muted/50 text-foreground',
								)
							"
						>
							<component :is="tab.icon" class="size-4 shrink-0" />
							<span class="truncate">{{ $t(tab.label) }}</span>
						</RouterLink>
					</div>
				</nav>

				<div class="mt-6 min-w-0 lg:mt-0">
					<RouterView v-if="canManage || isMemberTab" :guild="guild.data.value" />
				</div>
			</div>
		</template>
	</div>
</template>
