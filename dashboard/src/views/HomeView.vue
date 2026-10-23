<script setup lang="ts">
import { getStats, loginUrl } from "@/api";
import SectionTitle from "@/components/common/SectionTitle.vue";
import StatTile from "@/components/common/StatTile.vue";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/composables/useAuth";
import { formatCompact, formatDuration } from "@/lib/format";
import { useQuery } from "@tanstack/vue-query";
import { Plus, Server } from "lucide-vue-next";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { DiscordIcon } from "vue3-simple-icons";

const { t } = useI18n();
const { isLoggedIn } = useAuth();
const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: getStats, refetchInterval: 30_000 });

const tiles = computed(() => [
	{ label: t("home.stats.servers"), value: formatCompact(stats.value?.guilds) },
	{ label: t("home.stats.users"), value: formatCompact(stats.value?.users) },
	{ label: t("home.stats.commands"), value: formatCompact(stats.value?.commands) },
	{ label: t("home.stats.uptime"), value: formatDuration(stats.value?.uptime) },
	{ label: t("home.stats.ping"), value: stats.value ? `${stats.value.ping}ms` : "—" },
	{
		label: t("home.stats.music"),
		value: formatCompact(stats.value?.music.playing),
		hint: stats.value ? t("home.stats.musicHint", { n: stats.value.music.players }) : undefined,
	},
]);
</script>

<template>
	<div class="space-y-10">
		<section class="panel panel-accent flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
			<div class="space-y-3">
				<h1 class="font-display text-5xl sm:text-6xl">JaBa</h1>
				<p class="max-w-xl text-lg text-muted-foreground">{{ $t("home.intro") }}</p>
			</div>

			<div class="flex flex-wrap gap-2 lg:justify-end">
				<Button v-if="stats" as="a" :href="stats.invite" target="_blank" rel="noopener" variant="outline">
					<Plus />
					{{ $t("home.invite") }}
				</Button>
				<Button v-if="isLoggedIn" as-child>
					<RouterLink :to="{ name: 'servers' }">
						<Server />
						{{ $t("home.myServers") }}
					</RouterLink>
				</Button>
				<Button v-else as="a" :href="loginUrl('/servers')">
					<DiscordIcon class="size-4" />
					{{ $t("common.signIn") }}
				</Button>
			</div>
		</section>

		<section class="space-y-4">
			<SectionTitle :title="$t('home.title')" :subtitle="stats ? `v${stats.version}` : undefined" />
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
				<StatTile
					v-for="tile in tiles"
					:key="tile.label"
					:label="tile.label"
					:value="tile.value"
					:hint="tile.hint"
				/>
			</div>
		</section>
	</div>
</template>
