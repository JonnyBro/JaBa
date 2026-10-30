<script setup lang="ts">
import { createRemind, deleteRemind, getProfile, updateProfile } from "@/api";
import type { Remind } from "@/api/types";
import EmptyState from "@/components/common/EmptyState.vue";
import ErrorState from "@/components/common/ErrorState.vue";
import SectionTitle from "@/components/common/SectionTitle.vue";
import StatTile from "@/components/common/StatTile.vue";
import UserAvatar from "@/components/common/UserAvatar.vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/composables/useAuth";
import { formatDate, formatDateTime, formatNumber, formatRelative } from "@/lib/format";
import { getErrorMessage } from "@/plugins/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { BellPlus, LoaderCircle, Save, Trash2, Trophy } from "lucide-vue-next";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";

const MAX_BIO = 500;

const { t } = useI18n();
const { me } = useAuth();
const queryClient = useQueryClient();
const profile = useQuery({ queryKey: ["profile"], queryFn: getProfile });

const refresh = () => queryClient.invalidateQueries({ queryKey: ["profile"] });
const onError = (error: unknown) => toast.error(getErrorMessage(error));

const pad = (n: number) => String(n).padStart(2, "0");
const toDateInput = (ms: number | null) => {
	if (!ms) return "";
	const date = new Date(ms);
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const bio = ref("");
const birthdate = ref("");

watch(
	() => profile.data.value,
	data => {
		if (!data) return;
		bio.value = data.bio ?? "";
		birthdate.value = toDateInput(data.birthdate);
	},
	{ immediate: true },
);

const saveBio = useMutation({
	mutationFn: () => updateProfile({ bio: bio.value.trim() || null }),
	onSuccess: async () => {
		toast.success(t("profile.saved"));
		await refresh();
	},
	onError,
});

const saveBirthdate = useMutation({
	mutationFn: (clear: boolean = false) => {
		if (clear || !birthdate.value) return updateProfile({ birthdate: null });

		const [year, month, day] = birthdate.value.split("-").map(Number);
		return updateProfile({ birthdate: { day, month, year } });
	},
	onSuccess: async () => {
		toast.success(t("profile.saved"));
		await refresh();
	},
	onError,
});

const remindMessage = ref("");
const remindAt = ref("");
const minRemindAt = computed(() => {
	const now = new Date(Date.now() + 60_000);
	return `${toDateInput(now.getTime())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
});

const addRemind = useMutation({
	mutationFn: () => createRemind({ message: remindMessage.value, sendAt: new Date(remindAt.value).getTime() }),
	onSuccess: async () => {
		toast.success(t("profile.remindCreated"));
		remindMessage.value = "";
		remindAt.value = "";
		await refresh();
	},
	onError,
});

const removeRemind = useMutation({
	mutationFn: (remind: Remind) => deleteRemind(remind),
	onSuccess: refresh,
	onError,
});
</script>

<template>
	<div class="space-y-10">
		<ErrorState v-if="profile.isError.value" :error="profile.error.value" @retry="profile.refetch()" />
		<Skeleton v-else-if="profile.isPending.value || !me" class="h-40" />

		<template v-else-if="profile.data.value">
			<section class="flex flex-col gap-4 sm:flex-row sm:items-stretch">
				<div class="hud-panel hud-edge flex flex-1 items-center gap-4 p-4">
					<UserAvatar :name="me.displayName" :src="me.avatar" class="size-16" />
					<div class="min-w-0">
						<h1 class="truncate font-hud text-3xl">{{ me.displayName }}</h1>
						<p class="truncate text-muted-foreground">{{ me.username }}</p>
					</div>
				</div>
				<StatTile :label="$t('profile.rep')" :value="formatNumber(profile.data.value.rep)" class="sm:w-48" />
				<StatTile
					:label="$t('profile.registered')"
					:value="formatDate(profile.data.value.registeredAt)"
					class="sm:shrink-0"
				/>
			</section>

			<section class="grid gap-4 lg:grid-cols-2">
				<form class="hud-panel space-y-3 p-4" @submit.prevent="saveBio.mutate()">
					<Label for="bio" class="hud-title text-lg">{{ $t("profile.bio") }}</Label>
					<textarea
						id="bio"
						v-model="bio"
						rows="4"
						:maxlength="MAX_BIO"
						:placeholder="$t('profile.bioPlaceholder')"
						class="w-full resize-y rounded-md border border-input bg-card px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-hl"
					/>
					<div class="flex items-center justify-between">
						<span class="font-hud text-sm text-muted-foreground">{{ bio.length }} / {{ MAX_BIO }}</span>
						<Button type="submit" size="sm" :disabled="saveBio.isPending.value">
							<LoaderCircle v-if="saveBio.isPending.value" class="animate-spin" />
							<Save v-else />
							{{ $t("common.save") }}
						</Button>
					</div>
				</form>

				<form class="hud-panel space-y-3 p-4" @submit.prevent="saveBirthdate.mutate(false)">
					<Label for="birthdate" class="hud-title text-lg">{{ $t("profile.birthdate") }}</Label>
					<p class="text-sm text-muted-foreground">{{ $t("profile.birthdateHint") }}</p>
					<Input id="birthdate" v-model="birthdate" type="date" :max="toDateInput(Date.now())" />
					<div class="flex justify-end gap-2">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							:disabled="!profile.data.value.birthdate || saveBirthdate.isPending.value"
							@click="saveBirthdate.mutate(true)"
						>
							{{ $t("profile.clear") }}
						</Button>
						<Button type="submit" size="sm" :disabled="!birthdate || saveBirthdate.isPending.value">
							<Save />
							{{ $t("common.save") }}
						</Button>
					</div>
				</form>
			</section>

			<section class="space-y-4">
				<SectionTitle :title="$t('profile.reminds')" :subtitle="$t('profile.remindsHint')" />

				<form
					class="hud-panel grid gap-3 p-4 sm:grid-cols-[1fr_14rem_auto] sm:items-end"
					@submit.prevent="addRemind.mutate()"
				>
					<div class="space-y-1">
						<Label for="remind-message">{{ $t("profile.remindMessage") }}</Label>
						<Input id="remind-message" v-model="remindMessage" maxlength="1000" />
					</div>
					<div class="space-y-1">
						<Label for="remind-at">{{ $t("profile.remindAt") }}</Label>
						<Input id="remind-at" v-model="remindAt" type="datetime-local" :min="minRemindAt" />
					</div>
					<Button type="submit" :disabled="!remindMessage.trim() || !remindAt || addRemind.isPending.value">
						<LoaderCircle v-if="addRemind.isPending.value" class="animate-spin" />
						<BellPlus v-else />
						{{ $t("profile.addRemind") }}
					</Button>
				</form>

				<EmptyState v-if="!profile.data.value.reminds.length" :title="$t('profile.noReminds')" />
				<ul v-else class="hud-panel divide-y">
					<li
						v-for="remind in profile.data.value.reminds"
						:key="`${remind.createdAt}-${remind.sendAt}`"
						class="flex items-center gap-3 px-3 py-2"
					>
						<div class="min-w-0 flex-1">
							<p class="break-words">{{ remind.message }}</p>
							<p class="text-sm text-muted-foreground">
								{{ formatDateTime(remind.sendAt * 1000) }} · {{ formatRelative(remind.sendAt * 1000) }}
							</p>
						</div>
						<Button
							variant="ghost"
							size="icon-sm"
							:aria-label="$t('common.delete')"
							:disabled="removeRemind.isPending.value"
							@click="removeRemind.mutate(remind)"
						>
							<Trash2 />
						</Button>
					</li>
				</ul>
			</section>

			<section class="space-y-4">
				<SectionTitle :title="$t('profile.economy')" :subtitle="$t('profile.economyHint')" />

				<EmptyState v-if="!profile.data.value.servers.length" :title="$t('profile.noEconomy')" />
				<div v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					<RouterLink
						v-for="server in profile.data.value.servers"
						:key="server.id"
						:to="{ name: 'server-leaderboard', params: { id: server.id } }"
						class="hud-panel flex items-center gap-3 p-3 transition-colors hover:border-hl"
					>
						<UserAvatar :name="server.name" :src="server.icon" class="size-10" />
						<div class="min-w-0 flex-1">
							<p class="truncate font-hud">{{ server.name }}</p>
							<p class="text-sm text-muted-foreground">
								{{
									$t("profile.economyLine", {
										credits: formatNumber(server.money + server.bank),
										level: server.level,
									})
								}}
							</p>
						</div>
						<Trophy class="size-4 text-muted-foreground" />
					</RouterLink>
				</div>
			</section>
		</template>
	</div>
</template>
