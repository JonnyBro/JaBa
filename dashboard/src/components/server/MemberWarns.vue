<script setup lang="ts">
import { getMemberWarns, removeWarn, warnMember } from "@/api";
import type { Warn } from "@/api/types";
import Hint from "@/components/common/Hint.vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/plugins/axios";
import { LoaderCircle, TriangleAlert, X } from "@lucide/vue";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";

const props = defineProps<{ guildId: string; userId: string; canWarn: boolean }>();

const { t } = useI18n();
const queryClient = useQueryClient();

const queryKey = computed(() => ["guild", props.guildId, "member", props.userId, "warns"]);

const warns = useQuery({
	queryKey,
	queryFn: () => getMemberWarns(props.guildId, props.userId),
});

const active = computed(() => warns.data.value?.filter(w => w.active).length ?? 0);

const refresh = () =>
	Promise.all([
		queryClient.invalidateQueries({ queryKey: queryKey.value }),
		queryClient.invalidateQueries({ queryKey: ["guild", props.guildId, "warns"] }),
	]);

const reason = ref("");

const warn = useMutation({
	mutationFn: () => warnMember(props.guildId, props.userId, reason.value),
	onSuccess: async ({ count, punishment, punished }) => {
		reason.value = "";
		toast.success(t("warns.warned", { count }), {
			description: punishment ? t(punished ? "warns.punished" : "warns.punishFailed", { punishment }) : undefined,
		});
		await refresh();
	},
	onError: error => toast.error(getErrorMessage(error)),
});

const remove = useMutation({
	mutationFn: (item: Warn) => removeWarn(props.guildId, item.id),
	onSuccess: async () => {
		toast.success(t("warns.removed"));
		await refresh();
	},
	onError: error => toast.error(getErrorMessage(error)),
});
</script>

<template>
	<section class="space-y-3">
		<h3 class="hud-title text-lg">
			{{ $t("warns.title") }}
			<span class="font-sans text-sm text-muted-foreground">
				{{ $t("warns.activeCount", { active, total: warns.data.value?.length ?? 0 }) }}
			</span>
		</h3>

		<Hint :text="canWarn ? undefined : $t('warns.cantWarn')">
			<form class="flex gap-2" @submit.prevent="warn.mutate()">
				<Input v-model="reason" maxlength="500" :placeholder="$t('warns.reason')" :disabled="!canWarn" />
				<Button type="submit" variant="outline" :disabled="!canWarn || warn.isPending.value">
					<LoaderCircle v-if="warn.isPending.value" class="animate-spin" />
					<TriangleAlert v-else />
					{{ $t("warns.warn") }}
				</Button>
			</form>
		</Hint>

		<p v-if="warns.data.value && !warns.data.value.length" class="text-sm text-muted-foreground">
			{{ $t("warns.none") }}
		</p>
		<ul v-else-if="warns.data.value" class="divide-y border">
			<li
				v-for="item in warns.data.value"
				:key="item.id"
				:class="cn('flex items-start gap-2 p-2 text-sm', !item.active && 'opacity-50')"
			>
				<div class="min-w-0 flex-1">
					<p :class="cn('wrap-break-word', item.removed && 'line-through')">
						{{ item.reason ?? $t("warns.noReason") }}
					</p>
					<p class="text-xs text-muted-foreground">
						#{{ item.shortId }} · {{ formatDateTime(item.createdAt) }} ·
						{{ item.moderatorName ?? item.moderatorId }}
						<template v-if="item.removed"> · {{ $t("warns.removedBadge") }}</template>
						<template v-else-if="!item.active"> · {{ $t("warns.expired") }}</template>
					</p>
				</div>
				<Button
					v-if="!item.removed"
					variant="ghost"
					size="icon-sm"
					:aria-label="$t('warns.remove')"
					:disabled="remove.isPending.value"
					@click="remove.mutate(item)"
				>
					<X />
				</Button>
			</li>
		</ul>
	</section>
</template>
