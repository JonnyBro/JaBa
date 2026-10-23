<script setup lang="ts">
import { getAudit } from "@/api";
import type { AuditEntry, GuildDetails } from "@/api/types";
import EmptyState from "@/components/common/EmptyState.vue";
import ErrorState from "@/components/common/ErrorState.vue";
import Hint from "@/components/common/Hint.vue";
import PaginationBar from "@/components/common/PaginationBar.vue";
import UserAvatar from "@/components/common/UserAvatar.vue";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime, formatRelative } from "@/lib/format";
import { keepPreviousData, useQuery } from "@tanstack/vue-query";
import { ExternalLink } from "lucide-vue-next";
import { computed, ref } from "vue";

const PER_PAGE = 25;

const props = defineProps<{ guild: GuildDetails }>();

const page = ref(1);
const params = computed(() => ({ page: page.value, limit: PER_PAGE }));
const audit = useQuery({
	queryKey: ["guild", props.guild.id, "audit", params],
	queryFn: () => getAudit(props.guild.id, params.value),
	placeholderData: keepPreviousData,
});

/** "field: old → new" for every field that changed */
const diff = (entry: AuditEntry) => {
	const { before, after } = entry.details as { before?: Record<string, unknown>; after?: Record<string, unknown> };
	if (!before || !after) return [];

	return Object.keys(after)
		.filter(key => before[key] !== after[key])
		.map(key => ({ key, from: before[key] ?? "—", to: after[key] ?? "—" }));
};

const messageUrl = (entry: AuditEntry) => entry.details.messageUrl as string | undefined;
const reason = (entry: AuditEntry) => entry.details.reason as string | null | undefined;
</script>

<template>
	<div class="space-y-4">
		<ErrorState v-if="audit.isError.value" :error="audit.error.value" @retry="audit.refetch()" />
		<div v-else-if="audit.isPending.value" class="space-y-2">
			<Skeleton v-for="i in 6" :key="i" class="h-14 w-full" />
		</div>
		<EmptyState
			v-else-if="!audit.data.value?.items.length"
			:title="$t('audit.empty')"
			:description="$t('audit.emptyText')"
		/>
		<template v-else>
			<ul class="hud-panel divide-y" :class="audit.isPlaceholderData.value && 'opacity-60'">
				<li v-for="entry in audit.data.value.items" :key="entry.id" class="flex gap-3 p-3">
					<UserAvatar :name="entry.actorName" :src="entry.actorAvatar" class="size-8" />
					<div class="min-w-0 flex-1 space-y-1">
						<p>
							<span class="font-medium">{{ entry.actorName }}</span>
							{{ " " }}
							<span class="text-muted-foreground">{{ $t(`audit.actions.${entry.action}`) }}</span>
							<template v-if="entry.targetName">
								{{ " " }}
								<span class="font-medium">{{ entry.targetName }}</span>
							</template>
						</p>
						<ul v-if="diff(entry).length" class="font-hud text-sm text-muted-foreground">
							<li v-for="change in diff(entry)" :key="change.key">
								{{ change.key }}: {{ change.from }} →
								<span class="text-foreground">{{ change.to }}</span>
							</li>
						</ul>
						<p v-if="reason(entry)" class="text-sm text-muted-foreground">
							{{ $t("audit.reason", { reason: reason(entry) }) }}
						</p>
						<a
							v-if="messageUrl(entry)"
							:href="messageUrl(entry)"
							target="_blank"
							rel="noopener"
							class="inline-flex items-center gap-1 text-sm hover:text-hl"
						>
							<ExternalLink class="size-3.5" />
							{{ $t("audit.openMessage") }}
						</a>
					</div>
					<Hint :text="formatDateTime(entry.createdAt)">
						<span class="shrink-0 cursor-help text-sm text-muted-foreground">
							{{ formatRelative(entry.createdAt) }}
						</span>
					</Hint>
				</li>
			</ul>
			<PaginationBar v-model="page" :total="audit.data.value.total" :per-page="PER_PAGE" />
		</template>
	</div>
</template>
