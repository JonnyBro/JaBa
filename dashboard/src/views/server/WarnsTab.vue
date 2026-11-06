<script setup lang="ts">
import { getWarns, removeWarn, updateWarnSettings } from "@/api";
import type { GuildDetails, Warn, WarnAction, WarnSettings } from "@/api/types";
import EmptyState from "@/components/common/EmptyState.vue";
import ErrorState from "@/components/common/ErrorState.vue";
import UserAvatar from "@/components/common/UserAvatar.vue";
import MemberSheet from "@/components/server/MemberSheet.vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/plugins/axios";
import { LoaderCircle, Plus, Save, Trash2, X } from "@lucide/vue";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";

const ACTIONS: WarnAction[] = ["timeout", "kick", "ban"];
const MAX_RULES = 10;

const props = defineProps<{ guild: GuildDetails }>();

const { t } = useI18n();
const queryClient = useQueryClient();

const warns = useQuery({
	queryKey: ["guild", props.guild.id, "warns"],
	queryFn: () => getWarns(props.guild.id),
});

// Vue turns number inputs into numbers, but an emptied one gives back ""
type RuleRow = { key: number; count: number | ""; action: WarnAction; minutes: number | "" };

const form = reactive<{ expireDays: number | ""; dm: boolean }>({
	expireDays: 0,
	dm: true,
});
const rules = ref<RuleRow[]>([]);
let nextKey = 0;

const reset = (settings: WarnSettings) => {
	Object.assign(form, { expireDays: settings.expireDays, dm: settings.dm });
	rules.value = settings.rules.map(r => ({ key: nextKey++, ...r, minutes: r.minutes ?? 60 }));
};

watch(
	() => warns.data.value?.settings,
	settings => settings && reset(settings),
	{ immediate: true },
);

const payload = computed<WarnSettings>(() => ({
	expireDays: Number(form.expireDays) || 0,
	dm: form.dm,
	rules: rules.value
		.map(r => ({
			count: Number(r.count),
			action: r.action,
			minutes: r.action === "timeout" ? Number(r.minutes) : null,
		}))
		.sort((a, b) => a.count - b.count),
}));

const isDirty = computed(
	() => !!warns.data.value && JSON.stringify(payload.value) !== JSON.stringify(warns.data.value.settings),
);

const addRule = () => {
	const highest = Math.max(0, ...rules.value.map(r => Number(r.count) || 0));
	rules.value.push({ key: nextKey++, count: highest + 2, action: "timeout", minutes: 60 });
};

const removeRule = (key: number) => (rules.value = rules.value.filter(r => r.key !== key));

const refresh = () => queryClient.invalidateQueries({ queryKey: ["guild", props.guild.id] });

const save = useMutation({
	mutationFn: () => updateWarnSettings(props.guild.id, payload.value),
	onSuccess: async () => {
		toast.success(t("warns.saved"));
		await refresh();
	},
	onError: error => toast.error(getErrorMessage(error)),
});

const remove = useMutation({
	mutationFn: (warn: Warn) => removeWarn(props.guild.id, warn.id),
	onSuccess: async () => {
		toast.success(t("warns.removed"));
		await refresh();
	},
	onError: error => toast.error(getErrorMessage(error)),
});

const selectedUser = ref<string | null>(null);
</script>

<template>
	<ErrorState v-if="warns.isError.value" :error="warns.error.value" @retry="warns.refetch()" />
	<Skeleton v-else-if="warns.isPending.value" class="h-64" />

	<div v-else-if="warns.data.value" class="space-y-6">
		<form class="space-y-6" @submit.prevent="save.mutate()">
			<section class="hud-panel grid gap-4 p-4 sm:grid-cols-2">
				<h2 class="hud-title text-lg sm:col-span-2">{{ $t("warns.settingsTitle") }}</h2>

				<div class="space-y-2">
					<Label for="warns-expire">{{ $t("warns.expireDays") }}</Label>
					<Input id="warns-expire" v-model="form.expireDays" type="number" min="0" max="365" />
					<p class="text-xs text-muted-foreground">{{ $t("warns.expireHint") }}</p>
				</div>
				<p class="text-sm text-muted-foreground sm:self-center">
					{{ $t("warns.logHint") }}
					<RouterLink
						:to="{ name: 'server-modlog', params: { id: guild.id } }"
						class="text-hl hover:underline"
					>
						{{ $t("server.tabs.modlog") }}
					</RouterLink>
				</p>

				<Label class="flex items-center gap-2 font-normal sm:col-span-2">
					<input v-model="form.dm" type="checkbox" class="accent-hl" />
					{{ $t("warns.dm") }}
				</Label>
			</section>

			<section class="hud-panel space-y-4 p-4">
				<div class="flex flex-wrap items-center justify-between gap-2">
					<div>
						<h2 class="hud-title text-lg">{{ $t("warns.rulesTitle") }}</h2>
						<p class="text-sm text-muted-foreground">{{ $t("warns.rulesHint") }}</p>
					</div>
					<Button type="button" variant="outline" :disabled="rules.length >= MAX_RULES" @click="addRule">
						<Plus />
						{{ $t("warns.addRule") }}
					</Button>
				</div>

				<p v-if="!rules.length" class="text-sm text-muted-foreground">{{ $t("warns.noRules") }}</p>

				<div v-for="rule in rules" :key="rule.key" class="flex flex-wrap items-end gap-2">
					<div class="w-24 space-y-1">
						<Label :for="`rule-count-${rule.key}`" class="text-xs">{{ $t("warns.count") }}</Label>
						<Input
							:id="`rule-count-${rule.key}`"
							v-model="rule.count"
							type="number"
							min="1"
							max="100"
							required
						/>
					</div>
					<div class="w-40 space-y-1">
						<Label :for="`rule-action-${rule.key}`" class="text-xs">{{ $t("warns.action") }}</Label>
						<Select :id="`rule-action-${rule.key}`" v-model="rule.action">
							<SelectTrigger class="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem v-for="action in ACTIONS" :key="action" :value="action">
									{{ $t(`warns.actions.${action}`) }}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div v-if="rule.action === 'timeout'" class="w-32 space-y-1">
						<Label :for="`rule-minutes-${rule.key}`" class="text-xs">{{ $t("warns.minutes") }}</Label>
						<Input
							:id="`rule-minutes-${rule.key}`"
							v-model="rule.minutes"
							type="number"
							min="1"
							max="40320"
							required
						/>
					</div>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						:aria-label="$t('common.delete')"
						@click="removeRule(rule.key)"
					>
						<Trash2 />
					</Button>
				</div>
			</section>

			<div class="flex justify-end gap-2">
				<Button type="button" variant="ghost" :disabled="!isDirty" @click="reset(warns.data.value.settings)">
					{{ $t("common.cancel") }}
				</Button>
				<Button type="submit" :disabled="!isDirty || save.isPending.value">
					<LoaderCircle v-if="save.isPending.value" class="animate-spin" />
					<Save v-else />
					{{ $t("common.save") }}
				</Button>
			</div>
		</form>

		<section class="space-y-3">
			<h2 class="hud-title text-lg">{{ $t("warns.recentTitle") }}</h2>

			<EmptyState v-if="!warns.data.value.recent.length" :title="$t('warns.recentEmpty')" />
			<ul v-else class="hud-panel divide-y">
				<li
					v-for="warn in warns.data.value.recent"
					:key="warn.id"
					:class="cn('flex items-center gap-3 p-3', !warn.active && 'opacity-50')"
				>
					<UserAvatar :name="warn.userName ?? warn.userId" :src="warn.userAvatar" class="size-8" />
					<button type="button" class="min-w-0 flex-1 text-left" @click="selectedUser = warn.userId">
						<p class="truncate">
							<span class="font-medium">{{ warn.userName ?? warn.userId }}</span>
							<span :class="cn('text-muted-foreground', warn.removed && 'line-through')">
								· {{ warn.reason ?? $t("warns.noReason") }}
							</span>
						</p>
						<p class="text-xs text-muted-foreground">
							#{{ warn.shortId }} · {{ formatRelative(warn.createdAt) }} ·
							{{ warn.moderatorName ?? warn.moderatorId }}
							<template v-if="warn.removed"> · {{ $t("warns.removedBadge") }}</template>
							<template v-else-if="!warn.active"> · {{ $t("warns.expired") }}</template>
						</p>
					</button>
					<Button
						v-if="!warn.removed"
						variant="ghost"
						size="icon-sm"
						:aria-label="$t('warns.remove')"
						:disabled="remove.isPending.value"
						@click="remove.mutate(warn)"
					>
						<X />
					</Button>
				</li>
			</ul>
		</section>

		<MemberSheet v-model:user-id="selectedUser" :guild-id="guild.id" />
	</div>
</template>
