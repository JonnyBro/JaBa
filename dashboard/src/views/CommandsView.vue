<script setup lang="ts">
import { getCommands } from "@/api";
import type { BotCommand } from "@/api/types";
import EmptyState from "@/components/common/EmptyState.vue";
import ErrorState from "@/components/common/ErrorState.vue";
import SectionTitle from "@/components/common/SectionTitle.vue";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { currentLocale } from "@/i18n";
import { useQuery } from "@tanstack/vue-query";
import { MessageSquare, Search, Server, User } from "@lucide/vue";
import { computed, ref } from "vue";

const commands = useQuery({
	queryKey: ["commands", currentLocale],
	queryFn: () => getCommands(currentLocale.value),
	staleTime: 10 * 60_000,
});

const search = ref("");

const groups = computed(() => {
	const q = search.value.trim().toLowerCase();
	const list = (commands.data.value ?? []).filter(
		cmd => !q || cmd.displayName.toLowerCase().includes(q) || cmd.description.toLowerCase().includes(q),
	);

	const grouped = new Map<string, BotCommand[]>();
	for (const cmd of list) grouped.set(cmd.category, [...(grouped.get(cmd.category) ?? []), cmd]);

	return [...grouped.entries()].map(([category, cmds]) => ({
		category,
		slash: cmds.filter(c => c.type === "slash"),
		context: cmds.filter(c => c.type !== "slash"),
	}));
});

const lines = (text: string) => text.split("\n").filter(Boolean);
</script>

<template>
	<section class="space-y-6">
		<SectionTitle :title="$t('commands.title')" :subtitle="$t('commands.subtitle')">
			<div class="relative w-full sm:w-72">
				<Search class="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input v-model="search" :placeholder="$t('commands.search')" class="pl-8" />
			</div>
		</SectionTitle>

		<ErrorState v-if="commands.isError.value" :error="commands.error.value" @retry="commands.refetch()" />
		<div v-else-if="commands.isPending.value" class="grid gap-4 md:grid-cols-2">
			<Skeleton v-for="i in 6" :key="i" class="h-40" />
		</div>
		<EmptyState v-else-if="!groups.length" :title="$t('commands.empty')" />

		<div v-else class="space-y-8">
			<div v-for="group in groups" :key="group.category" class="space-y-3">
				<h2 class="hud-title capitalize">{{ group.category }}</h2>

				<div class="grid gap-3 md:grid-cols-2">
					<article v-for="cmd in group.slash" :key="cmd.name" class="hud-panel space-y-2 p-3">
						<div class="flex flex-wrap items-center gap-2">
							<span class="font-hud text-lg">{{ cmd.displayName }}</span>
							<Badge v-if="cmd.guildOnly" variant="secondary"
								><Server /> {{ $t("commands.guildOnly") }}</Badge
							>
						</div>
						<p class="text-muted-foreground">{{ cmd.description }}</p>
						<div v-if="cmd.usage || cmd.examples" class="flex flex-wrap gap-1">
							<code
								v-for="example in lines(cmd.examples)"
								:key="example"
								class="bg-muted px-1.5 py-0.5 font-mono text-sm"
							>
								/{{ example }}
							</code>
						</div>
					</article>

					<article v-for="cmd in group.context" :key="cmd.name" class="hud-panel space-y-2 p-3">
						<div class="flex flex-wrap items-center gap-2">
							<span class="font-hud text-lg">{{ cmd.displayName }}</span>
							<Badge variant="outline">
								<User v-if="cmd.type === 'user'" />
								<MessageSquare v-else />
								{{ $t(`commands.context.${cmd.type}`) }}
							</Badge>
						</div>
						<p class="text-muted-foreground">{{ cmd.description }}</p>
					</article>
				</div>
			</div>
		</div>
	</section>
</template>
