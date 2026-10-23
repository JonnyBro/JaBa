<script setup lang="ts">
import SectionTitle from "@/components/common/SectionTitle.vue";
import { cn } from "@/lib/utils";
import { useRoute } from "vue-router";

const route = useRoute();

const tabs = [
	{ name: "owner", label: "owner.tabs.overview" },
	{ name: "owner-servers", label: "owner.tabs.servers" },
	{ name: "owner-lavalink", label: "owner.tabs.lavalink" },
	{ name: "owner-stats", label: "owner.tabs.stats" },
	{ name: "owner-blacklist", label: "owner.tabs.blacklist" },
	{ name: "owner-logs", label: "owner.tabs.logs" },
];
</script>

<template>
	<div class="space-y-6">
		<SectionTitle :title="$t('owner.title')" :subtitle="$t('owner.subtitle')" />

		<nav class="flex gap-1 overflow-x-auto border-b">
			<RouterLink
				v-for="tab in tabs"
				:key="tab.name"
				:to="{ name: tab.name }"
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

		<RouterView />
	</div>
</template>
