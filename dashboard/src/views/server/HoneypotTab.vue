<script setup lang="ts">
import { getHoneypot, updateHoneypot } from "@/api";
import { HONEYPOT_ACTIONS, type GuildDetails, type HoneypotSettings } from "@/api/types";
import ErrorState from "@/components/common/ErrorState.vue";
import ChannelSelect from "@/components/server/ChannelSelect.vue";
import MessagePreview from "@/components/server/MessagePreview.vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/plugins/axios";
import { LoaderCircle, Save, TriangleAlert, X } from "@lucide/vue";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";

const MAX_CHANNELS = 5;
const MAX_TEXT = 2000;
const WARNING_COLOR = "#ED4245";

const props = defineProps<{ guild: GuildDetails }>();

const { t } = useI18n();
const queryClient = useQueryClient();

const honeypot = useQuery({
	queryKey: ["guild", props.guild.id, "honeypot"],
	queryFn: () => getHoneypot(props.guild.id),
});

// Vue turns number inputs into numbers, but an emptied one gives back ""
const form = reactive<{
	channels: string[];
	action: HoneypotSettings["action"];
	deleteHours: number | "";
	timeoutMinutes: number | "";
	dm: boolean;
	warning: boolean;
	warningText: string;
}>({
	channels: [],
	action: "softban",
	deleteHours: 1,
	timeoutMinutes: 1440,
	dm: true,
	warning: true,
	warningText: "",
});

const reset = (settings: HoneypotSettings) =>
	Object.assign(form, { ...settings, channels: [...settings.channels], warningText: settings.warningText ?? "" });

watch(
	() => honeypot.data.value?.settings,
	settings => settings && reset(settings),
	{ immediate: true },
);

const payload = computed<HoneypotSettings>(() => ({
	channels: form.channels,
	action: form.action,
	deleteHours: Number(form.deleteHours) || 0,
	timeoutMinutes: Number(form.timeoutMinutes) || 1,
	dm: form.dm,
	warning: form.warning,
	warningText: form.warningText.trim() || null,
}));

const isDirty = computed(
	() => !!honeypot.data.value && JSON.stringify(payload.value) !== JSON.stringify(honeypot.data.value.settings),
);

const missingPermission = computed(() => {
	const data = honeypot.data.value;
	if (!data) return null;
	if (!data.canManageMessages) return "honeypot.noManageMessages";
	if (form.action === "timeout" ? !data.canTimeout : !data.canBan) return `honeypot.noPermission.${form.action}`;

	return null;
});

const previewText = computed(() => form.warningText.trim() || honeypot.data.value?.defaultWarnings[form.action] || "");

const channelName = (id: string) => props.guild.channels.find(c => c.id === id)?.name ?? id;

const freeChannels = computed(() => props.guild.channels.filter(c => !form.channels.includes(c.id)));

// The select only serves to pick a channel, it goes back to empty right after
const toAdd = ref<string | null>(null);
watch(toAdd, id => {
	if (!id) return;

	form.channels.push(id);
	toAdd.value = null;
});

const removeChannel = (id: string) => (form.channels = form.channels.filter(c => c !== id));

const save = useMutation({
	mutationFn: () => updateHoneypot(props.guild.id, payload.value),
	onSuccess: async () => {
		toast.success(t("honeypot.saved"));
		await queryClient.invalidateQueries({ queryKey: ["guild", props.guild.id, "honeypot"] });
	},
	onError: error => toast.error(getErrorMessage(error)),
});
</script>

<template>
	<ErrorState v-if="honeypot.isError.value" :error="honeypot.error.value" @retry="honeypot.refetch()" />
	<Skeleton v-else-if="honeypot.isPending.value" class="h-64" />

	<form v-else-if="honeypot.data.value" class="space-y-6" @submit.prevent="save.mutate()">
		<section class="hud-panel space-y-4 p-4">
			<div>
				<h2 class="hud-title text-lg">{{ $t("honeypot.title") }}</h2>
				<p class="text-sm text-muted-foreground">{{ $t("honeypot.hint") }}</p>
			</div>

			<div class="space-y-2">
				<Label>{{ $t("honeypot.channels") }}</Label>
				<div v-if="form.channels.length" class="flex flex-wrap gap-2">
					<span
						v-for="id in form.channels"
						:key="id"
						class="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-sm"
					>
						#{{ channelName(id) }}
						<button
							type="button"
							class="text-muted-foreground hover:text-foreground"
							:aria-label="$t('common.delete')"
							@click="removeChannel(id)"
						>
							<X class="size-3.5" />
						</button>
					</span>
				</div>
				<div class="max-w-sm">
					<ChannelSelect
						v-model="toAdd"
						:channels="freeChannels"
						:disabled="form.channels.length >= MAX_CHANNELS"
					/>
				</div>
				<p class="text-xs text-muted-foreground">{{ $t("honeypot.channelsHint", { max: MAX_CHANNELS }) }}</p>
			</div>

			<p v-if="missingPermission" class="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400">
				<TriangleAlert class="mt-0.5 size-4 shrink-0" />
				{{ $t(missingPermission) }}
			</p>
		</section>

		<section class="hud-panel grid gap-4 p-4 sm:grid-cols-2">
			<h2 class="hud-title text-lg sm:col-span-2">{{ $t("honeypot.punishTitle") }}</h2>

			<div class="space-y-2">
				<Label for="honeypot-action">{{ $t("honeypot.action") }}</Label>
				<Select id="honeypot-action" v-model="form.action">
					<SelectTrigger class="w-full">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem v-for="action in HONEYPOT_ACTIONS" :key="action" :value="action">
							{{ $t(`honeypot.actions.${action}`) }}
						</SelectItem>
					</SelectContent>
				</Select>
				<p class="text-xs text-muted-foreground">{{ $t(`honeypot.actionHints.${form.action}`) }}</p>
			</div>

			<div v-if="form.action === 'timeout'" class="space-y-2">
				<Label for="honeypot-timeout">{{ $t("honeypot.timeoutMinutes") }}</Label>
				<Input id="honeypot-timeout" v-model="form.timeoutMinutes" type="number" min="1" max="40320" />
			</div>

			<div class="space-y-2 sm:col-start-1">
				<Label for="honeypot-delete">{{ $t("honeypot.deleteHours") }}</Label>
				<Input id="honeypot-delete" v-model="form.deleteHours" type="number" min="0" max="168" />
				<p class="text-xs text-muted-foreground">{{ $t("honeypot.deleteHoursHint") }}</p>
			</div>

			<div class="space-y-2">
				<Label class="flex items-center gap-2 font-normal sm:mt-7">
					<input v-model="form.dm" type="checkbox" class="accent-hl" />
					{{ $t("honeypot.dm") }}
				</Label>
				<p class="text-xs text-muted-foreground">{{ $t("honeypot.dmHint") }}</p>
			</div>

			<p class="text-sm text-muted-foreground sm:col-span-2">
				{{ $t("honeypot.logHint") }}
				<RouterLink :to="{ name: 'server-modlog', params: { id: guild.id } }" class="text-hl hover:underline">
					{{ $t("server.tabs.modlog") }}
				</RouterLink>
			</p>
		</section>

		<section class="hud-panel grid gap-6 p-4 lg:grid-cols-2">
			<div class="space-y-4">
				<div>
					<h2 class="hud-title text-lg">{{ $t("honeypot.warningTitle") }}</h2>
					<p class="text-sm text-muted-foreground">{{ $t("honeypot.warningHint") }}</p>
				</div>

				<Label class="flex items-center gap-2 font-normal">
					<input v-model="form.warning" type="checkbox" class="accent-hl" />
					{{ $t("honeypot.warning") }}
				</Label>

				<div class="space-y-2">
					<Label for="honeypot-text">{{ $t("honeypot.warningText") }}</Label>
					<textarea
						id="honeypot-text"
						v-model="form.warningText"
						rows="6"
						:maxlength="MAX_TEXT"
						:disabled="!form.warning"
						:placeholder="honeypot.data.value.defaultWarnings[form.action]"
						class="w-full resize-y rounded-md border border-input bg-card px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-hl disabled:opacity-50"
					/>
					<p class="text-xs text-muted-foreground">{{ $t("honeypot.warningTextHint") }}</p>
				</div>
			</div>

			<MessagePreview
				v-if="form.warning"
				:blocks="[{ type: 'text', content: previewText }]"
				:color="WARNING_COLOR"
			/>
		</section>

		<div class="flex justify-end gap-2">
			<Button type="button" variant="ghost" :disabled="!isDirty" @click="reset(honeypot.data.value.settings)">
				{{ $t("common.cancel") }}
			</Button>
			<Button type="submit" :disabled="!isDirty || save.isPending.value">
				<LoaderCircle v-if="save.isPending.value" class="animate-spin" />
				<Save v-else />
				{{ $t("common.save") }}
			</Button>
		</div>
	</form>
</template>
