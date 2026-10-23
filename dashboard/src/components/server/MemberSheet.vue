<script setup lang="ts">
import { getMember, moderateMember, resetMember, updateMemberEconomy } from "@/api";
import type { Economy, ModerationAction } from "@/api/types";
import ConfirmDialog from "@/components/common/ConfirmDialog.vue";
import ErrorState from "@/components/common/ErrorState.vue";
import Hint from "@/components/common/Hint.vue";
import UserAvatar from "@/components/common/UserAvatar.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatDateTime, formatNumber } from "@/lib/format";
import { getErrorMessage } from "@/plugins/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { Ban, Clock, LoaderCircle, RotateCcw, Save, UserX } from "lucide-vue-next";
import { computed, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";

const ECONOMY_FIELDS = ["money", "bank", "exp", "level"] as const;
const TIMEOUTS = [5, 60, 24 * 60, 7 * 24 * 60, 28 * 24 * 60];
const BAN_DELETE_DAYS = [0, 1, 7];

const props = defineProps<{ guildId: string }>();
const userId = defineModel<string | null>("userId", { required: true });

const { t } = useI18n();
const queryClient = useQueryClient();

const open = computed({
	get: () => Boolean(userId.value),
	set: value => {
		if (!value) userId.value = null;
	},
});

const guildId = computed(() => props.guildId);

const member = useQuery({
	queryKey: ["guild", guildId, "member", userId],
	queryFn: () => getMember(props.guildId, userId.value!),
	enabled: () => Boolean(userId.value),
});

const economy = reactive<Economy>({ money: 0, bank: 0, exp: 0, level: 0 });

watch(
	() => member.data.value?.economy,
	value => value && Object.assign(economy, value),
	{ immediate: true },
);

const changes = computed(() => {
	const current = member.data.value?.economy;
	if (!current) return {};

	return Object.fromEntries(
		ECONOMY_FIELDS.filter(field => Number(economy[field]) !== current[field]).map(field => [
			field,
			Number(economy[field]),
		]),
	);
});

const isDirty = computed(() => Object.keys(changes.value).length > 0);

const refresh = () => queryClient.invalidateQueries({ queryKey: ["guild", props.guildId] });

const saveEconomy = useMutation({
	mutationFn: () => updateMemberEconomy(props.guildId, userId.value!, changes.value),
	onSuccess: async () => {
		toast.success(t("members.saved"));
		await refresh();
	},
	onError: error => toast.error(getErrorMessage(error)),
});

const resetOpen = ref(false);
const reset = useMutation({
	mutationFn: () => resetMember(props.guildId, userId.value!),
	onSuccess: async () => {
		toast.success(t("members.memberReset"));
		resetOpen.value = false;
		await refresh();
	},
	onError: error => toast.error(getErrorMessage(error)),
});

const action = ref<ModerationAction | null>(null);
const reason = ref("");
const minutes = ref(String(TIMEOUTS[1]));
const deleteDays = ref("0");

const actionOpen = computed({
	get: () => Boolean(action.value),
	set: value => {
		if (!value) action.value = null;
	},
});

const startAction = (value: ModerationAction) => {
	reason.value = "";
	action.value = value;
};

const moderate = useMutation({
	mutationFn: (removeTimeout: boolean = false) =>
		moderateMember(props.guildId, userId.value!, removeTimeout ? "timeout" : action.value!, {
			reason: reason.value.trim() || undefined,
			minutes: removeTimeout ? null : Number(minutes.value),
			deleteMessageDays: Number(deleteDays.value),
		}),
	onSuccess: async (_data, removeTimeout) => {
		const done = removeTimeout ? "timeoutRemoved" : action.value;
		toast.success(t(`members.moderation.done.${done}`, { name: member.data.value?.displayName }));

		// Kicked and banned members are gone from the server
		if (action.value === "kick" || action.value === "ban") userId.value = null;

		action.value = null;
		await refresh();
	},
	onError: error => toast.error(getErrorMessage(error)),
});

const timeoutLabel = (value: number) =>
	value < 60
		? t("members.moderation.minutes", value)
		: value < 24 * 60
			? t("members.moderation.hours", value / 60)
			: t("members.moderation.days", value / (24 * 60));
</script>

<template>
	<Sheet v-model:open="open">
		<SheetContent class="w-full overflow-y-auto sm:max-w-lg">
			<ErrorState v-if="member.isError.value" :error="member.error.value" class="m-4" @retry="member.refetch()" />

			<div v-else-if="member.isPending.value" class="space-y-4 p-4">
				<Skeleton class="h-16" />
				<Skeleton class="h-40" />
			</div>

			<template v-else-if="member.data.value">
				<SheetHeader>
					<div class="flex items-center gap-3">
						<UserAvatar
							:name="member.data.value.displayName"
							:src="member.data.value.avatar"
							class="size-14"
						/>
						<div class="min-w-0">
							<SheetTitle class="truncate font-display text-2xl">{{
								member.data.value.displayName
							}}</SheetTitle>
							<SheetDescription class="truncate">
								{{ member.data.value.username }} · {{ member.data.value.id }}
							</SheetDescription>
						</div>
					</div>
				</SheetHeader>

				<div class="space-y-6 px-4 pb-6">
					<dl class="grid grid-cols-2 gap-3 text-sm">
						<div>
							<dt class="text-muted-foreground">{{ $t("members.joined") }}</dt>
							<dd>{{ formatDate(member.data.value.joinedAt) }}</dd>
						</div>
						<div>
							<dt class="text-muted-foreground">{{ $t("members.rep") }}</dt>
							<dd class="font-display">{{ formatNumber(member.data.value.rep) }}</dd>
						</div>
						<div v-if="member.data.value.timeoutUntil" class="col-span-2">
							<dt class="text-muted-foreground">{{ $t("members.timedOutUntil") }}</dt>
							<dd>{{ formatDateTime(member.data.value.timeoutUntil) }}</dd>
						</div>
					</dl>

					<div v-if="member.data.value.roles.length" class="flex flex-wrap gap-1">
						<Badge v-for="role in member.data.value.roles" :key="role.id" variant="outline">
							<span class="size-2 rounded-full" :style="{ background: role.color }" />
							{{ role.name }}
						</Badge>
					</div>

					<section v-if="member.data.value.economy" class="space-y-3">
						<h3 class="section-title text-lg">{{ $t("members.economy") }}</h3>
						<form class="grid grid-cols-2 gap-3" @submit.prevent="saveEconomy.mutate()">
							<div v-for="field in ECONOMY_FIELDS" :key="field" class="space-y-1">
								<Label :for="`economy-${field}`">{{ $t(`members.${field}`) }}</Label>
								<Input
									:id="`economy-${field}`"
									v-model.number="economy[field]"
									type="number"
									min="0"
									step="1"
								/>
							</div>
							<div class="col-span-2 flex justify-between gap-2">
								<Button type="button" variant="outline" @click="resetOpen = true">
									<RotateCcw />
									{{ $t("members.resetMember") }}
								</Button>
								<Button type="submit" :disabled="!isDirty || saveEconomy.isPending.value">
									<LoaderCircle v-if="saveEconomy.isPending.value" class="animate-spin" />
									<Save v-else />
									{{ $t("common.save") }}
								</Button>
							</div>
						</form>
					</section>

					<section class="space-y-3">
						<h3 class="section-title text-lg">{{ $t("members.moderation.title") }}</h3>
						<div class="flex flex-wrap gap-2">
							<Hint
								:text="
									member.data.value.moderation.timeout
										? undefined
										: $t('members.moderation.notAllowed')
								"
							>
								<span class="inline-flex gap-2">
									<Button
										variant="outline"
										:disabled="!member.data.value.moderation.timeout"
										@click="startAction('timeout')"
									>
										<Clock />
										{{ $t("members.moderation.timeout") }}
									</Button>
									<Button
										v-if="member.data.value.timeoutUntil"
										variant="ghost"
										:disabled="!member.data.value.moderation.timeout || moderate.isPending.value"
										@click="moderate.mutate(true)"
									>
										{{ $t("members.moderation.removeTimeout") }}
									</Button>
								</span>
							</Hint>
							<Hint
								:text="
									member.data.value.moderation.kick ? undefined : $t('members.moderation.notAllowed')
								"
							>
								<span class="inline-flex">
									<Button
										variant="outline"
										:disabled="!member.data.value.moderation.kick"
										@click="startAction('kick')"
									>
										<UserX />
										{{ $t("members.moderation.kick") }}
									</Button>
								</span>
							</Hint>
							<Hint
								:text="
									member.data.value.moderation.ban ? undefined : $t('members.moderation.notAllowed')
								"
							>
								<span class="inline-flex">
									<Button
										variant="destructive"
										:disabled="!member.data.value.moderation.ban"
										@click="startAction('ban')"
									>
										<Ban />
										{{ $t("members.moderation.ban") }}
									</Button>
								</span>
							</Hint>
						</div>
					</section>

					<section v-if="member.data.value.economy" class="space-y-3">
						<h3 class="section-title text-lg">{{ $t("members.transactions") }}</h3>
						<p v-if="!member.data.value.transactions.length" class="text-muted-foreground">
							{{ $t("members.noTransactions") }}
						</p>
						<ul v-else class="divide-y border">
							<li
								v-for="(tx, i) in member.data.value.transactions"
								:key="i"
								class="flex items-center justify-between gap-2 px-3 py-2 text-sm"
							>
								<span class="min-w-0 truncate">
									<span class="font-display">{{ tx.type }}</span>
									<span v-if="tx.user" class="text-muted-foreground"> · {{ tx.user }}</span>
								</span>
								<span class="shrink-0 text-right">
									<span class="font-display">{{ formatNumber(tx.amount) }}</span>
									<span class="block text-xs text-muted-foreground">{{
										formatDateTime(tx.date)
									}}</span>
								</span>
							</li>
						</ul>
					</section>
				</div>
			</template>
		</SheetContent>
	</Sheet>

	<ConfirmDialog
		v-model:open="resetOpen"
		:title="$t('members.resetMemberTitle', { name: member.data.value?.displayName })"
		:description="$t('members.resetMemberText')"
		:confirm-text="$t('members.resetMember')"
		:loading="reset.isPending.value"
		@confirm="reset.mutate()"
	/>

	<Dialog v-model:open="actionOpen">
		<DialogContent>
			<DialogHeader>
				<DialogTitle>
					{{ action && $t(`members.moderation.${action}Title`, { name: member.data.value?.displayName }) }}
				</DialogTitle>
				<DialogDescription>{{ $t("members.moderation.reasonHint") }}</DialogDescription>
			</DialogHeader>

			<form id="moderate-member" class="space-y-4" @submit.prevent="moderate.mutate(false)">
				<div v-if="action === 'timeout'" class="space-y-2">
					<Label for="timeout-length">{{ $t("members.moderation.duration") }}</Label>
					<Select id="timeout-length" v-model="minutes">
						<SelectTrigger class="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem v-for="value in TIMEOUTS" :key="value" :value="String(value)">
								{{ timeoutLabel(value) }}
							</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div v-if="action === 'ban'" class="space-y-2">
					<Label for="ban-delete">{{ $t("members.moderation.deleteMessages") }}</Label>
					<Select id="ban-delete" v-model="deleteDays">
						<SelectTrigger class="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem v-for="days in BAN_DELETE_DAYS" :key="days" :value="String(days)">
								{{ days ? $t("members.moderation.days", days) : $t("members.moderation.dontDelete") }}
							</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div class="space-y-2">
					<Label for="moderation-reason">{{ $t("members.moderation.reason") }}</Label>
					<textarea
						id="moderation-reason"
						v-model="reason"
						rows="3"
						maxlength="400"
						class="w-full resize-y rounded-md border border-input bg-card px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-hl"
					/>
				</div>
			</form>

			<DialogFooter>
				<Button variant="outline" @click="action = null">{{ $t("common.cancel") }}</Button>
				<Button
					type="submit"
					form="moderate-member"
					:variant="action === 'timeout' ? 'default' : 'destructive'"
					:disabled="moderate.isPending.value"
				>
					<LoaderCircle v-if="moderate.isPending.value" class="animate-spin" />
					{{ action && $t(`members.moderation.${action}`) }}
				</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>
</template>
