<script setup lang="ts">
import { getLevels, syncLevelRoles, updateLevels } from "@/api";
import type { GuildDetails, LevelSettings, LevelUpMode } from "@/api/types";
import ConfirmDialog from "@/components/common/ConfirmDialog.vue";
import ErrorState from "@/components/common/ErrorState.vue";
import ChannelSelect from "@/components/server/ChannelSelect.vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/plugins/axios";
import { LoaderCircle, Plus, RefreshCw, Save, Trash2 } from "@lucide/vue";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";

const MODES: LevelUpMode[] = ["reply", "channel", "off"];
const MAX_REWARDS = 50;
// reka-ui selects can't hold an empty value
const NO_ROLE = "none";

const props = defineProps<{ guild: GuildDetails }>();

const { t } = useI18n();
const queryClient = useQueryClient();

const levels = useQuery({
	queryKey: ["guild", props.guild.id, "levels"],
	queryFn: () => getLevels(props.guild.id),
});

// Vue turns number inputs into numbers, but an emptied one gives back ""
type RewardRow = { key: number; level: number | ""; roleId: string; credits: number | "" };

const form = reactive<{ mode: LevelUpMode; channel: string | null; stack: boolean }>({
	mode: "reply",
	channel: null,
	stack: true,
});
const rewards = ref<RewardRow[]>([]);
let nextKey = 0;

const reset = (settings: LevelSettings) => {
	Object.assign(form, { mode: settings.mode, channel: settings.channel, stack: settings.stack });
	rewards.value = settings.rewards.map(r => ({
		key: nextKey++,
		level: r.level,
		roleId: r.roleId ?? NO_ROLE,
		credits: r.credits,
	}));
};

watch(
	() => levels.data.value,
	data => data && reset(data),
	{ immediate: true },
);

const payload = computed<LevelSettings>(() => ({
	mode: form.mode,
	channel: form.mode === "channel" ? form.channel : null,
	stack: form.stack,
	rewards: rewards.value
		.map(r => ({
			level: Number(r.level),
			roleId: r.roleId === NO_ROLE ? null : r.roleId,
			credits: Number(r.credits) || 0,
		}))
		.sort((a, b) => a.level - b.level),
}));

const isDirty = computed(() => {
	const data = levels.data.value;
	if (!data) return false;

	const saved: LevelSettings = { mode: data.mode, channel: data.channel, stack: data.stack, rewards: data.rewards };
	return JSON.stringify(payload.value) !== JSON.stringify(saved);
});

const addReward = () => {
	const highest = Math.max(0, ...rewards.value.map(r => Number(r.level) || 0));
	rewards.value.push({ key: nextKey++, level: highest + 5, roleId: NO_ROLE, credits: 0 });
};

const removeReward = (key: number) => (rewards.value = rewards.value.filter(r => r.key !== key));

const save = useMutation({
	mutationFn: () => updateLevels(props.guild.id, payload.value),
	onSuccess: settings => {
		queryClient.setQueryData(["guild", props.guild.id, "levels"], { ...levels.data.value, ...settings });
		toast.success(t("levels.saved"));
	},
	onError: error => toast.error(getErrorMessage(error)),
});

const hasRoleRewards = computed(() => Boolean(levels.data.value?.rewards.some(r => r.roleId)));
const syncOpen = ref(false);

const sync = useMutation({
	mutationFn: () => syncLevelRoles(props.guild.id),
	onSuccess: ({ members }) => {
		syncOpen.value = false;
		toast.success(t("levels.syncStarted", members));
	},
	onError: error => toast.error(getErrorMessage(error)),
});
</script>

<template>
	<ErrorState v-if="levels.isError.value" :error="levels.error.value" @retry="levels.refetch()" />
	<Skeleton v-else-if="levels.isPending.value" class="h-64" />

	<form v-else-if="levels.data.value" class="space-y-6" @submit.prevent="save.mutate()">
		<section class="hud-panel grid gap-6 p-4 sm:grid-cols-2">
			<h2 class="hud-title text-lg sm:col-span-2">{{ $t("levels.messageTitle") }}</h2>

			<div class="space-y-2">
				<Label for="levels-mode">{{ $t("levels.mode") }}</Label>
				<Select id="levels-mode" v-model="form.mode">
					<SelectTrigger class="w-full">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem v-for="mode in MODES" :key="mode" :value="mode">
							{{ $t(`levels.modes.${mode}`) }}
						</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div v-if="form.mode === 'channel'" class="space-y-2">
				<Label for="levels-channel">{{ $t("levels.channel") }}</Label>
				<ChannelSelect id="levels-channel" v-model="form.channel" :channels="guild.channels" />
			</div>
		</section>

		<section class="hud-panel space-y-4 p-4">
			<div class="flex flex-wrap items-center justify-between gap-2">
				<div>
					<h2 class="hud-title text-lg">{{ $t("levels.rewardsTitle") }}</h2>
					<p class="text-sm text-muted-foreground">{{ $t("levels.rewardsHint") }}</p>
				</div>
				<Button type="button" variant="outline" :disabled="rewards.length >= MAX_REWARDS" @click="addReward">
					<Plus />
					{{ $t("levels.addReward") }}
				</Button>
			</div>

			<p v-if="!rewards.length" class="text-sm text-muted-foreground">{{ $t("levels.noRewards") }}</p>

			<div
				v-for="reward in rewards"
				:key="reward.key"
				class="grid grid-cols-[5rem_1fr_auto] items-end gap-2 sm:grid-cols-[6rem_1fr_10rem_auto]"
			>
				<div class="space-y-1">
					<Label :for="`reward-level-${reward.key}`" class="text-xs">{{ $t("levels.level") }}</Label>
					<Input
						:id="`reward-level-${reward.key}`"
						v-model="reward.level"
						type="number"
						min="1"
						max="1000"
						required
					/>
				</div>

				<div class="min-w-0 space-y-1">
					<Label :for="`reward-role-${reward.key}`" class="text-xs">{{ $t("levels.role") }}</Label>
					<Select :id="`reward-role-${reward.key}`" v-model="reward.roleId">
						<SelectTrigger class="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem :value="NO_ROLE">{{ $t("levels.noRole") }}</SelectItem>
							<SelectItem v-for="role in levels.data.value.roles" :key="role.id" :value="role.id">
								<span class="size-2.5 shrink-0 rounded-full" :style="{ backgroundColor: role.color }" />
								<span class="truncate">{{ role.name }}</span>
							</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div
					class="col-span-2 col-start-1 row-start-2 space-y-1 sm:col-span-1 sm:col-start-auto sm:row-start-auto"
				>
					<Label :for="`reward-credits-${reward.key}`" class="text-xs">{{ $t("levels.credits") }}</Label>
					<Input :id="`reward-credits-${reward.key}`" v-model="reward.credits" type="number" min="0" />
				</div>

				<Button
					type="button"
					variant="ghost"
					size="icon"
					class="row-start-1 sm:row-start-auto"
					:aria-label="$t('common.delete')"
					@click="removeReward(reward.key)"
				>
					<Trash2 />
				</Button>
			</div>

			<Label class="flex items-center gap-2 font-normal">
				<input v-model="form.stack" type="checkbox" class="accent-hl" />
				{{ $t("levels.stack") }}
			</Label>
			<p class="text-xs text-muted-foreground">{{ $t("levels.roleHint") }}</p>
		</section>

		<section class="hud-panel flex flex-wrap items-center justify-between gap-4 p-4">
			<div class="max-w-2xl">
				<h2 class="hud-title text-lg">{{ $t("levels.syncTitle") }}</h2>
				<p class="text-sm text-muted-foreground">{{ $t("levels.syncHint") }}</p>
			</div>
			<Button
				type="button"
				variant="outline"
				:disabled="isDirty || !hasRoleRewards || sync.isPending.value"
				@click="syncOpen = true"
			>
				<RefreshCw />
				{{ $t("levels.sync") }}
			</Button>
		</section>

		<div class="flex justify-end gap-2">
			<Button type="button" variant="ghost" :disabled="!isDirty" @click="reset(levels.data.value)">
				{{ $t("common.cancel") }}
			</Button>
			<Button type="submit" :disabled="!isDirty || save.isPending.value">
				<LoaderCircle v-if="save.isPending.value" class="animate-spin" />
				<Save v-else />
				{{ $t("common.save") }}
			</Button>
		</div>
	</form>

	<ConfirmDialog
		v-model:open="syncOpen"
		:title="$t('levels.syncConfirm')"
		:description="$t('levels.syncConfirmText')"
		:confirm-text="$t('levels.sync')"
		:destructive="false"
		:loading="sync.isPending.value"
		@confirm="sync.mutate()"
	/>
</template>
