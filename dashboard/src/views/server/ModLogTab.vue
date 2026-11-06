<script setup lang="ts">
import { getModLog, updateModLog } from "@/api";
import type { GuildDetails, ModLogEvent, ModLogSettings } from "@/api/types";
import ErrorState from "@/components/common/ErrorState.vue";
import ChannelSelect from "@/components/server/ChannelSelect.vue";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/plugins/axios";
import { LoaderCircle, Save, TriangleAlert, X } from "@lucide/vue";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";

const GROUPS: { name: string; events: ModLogEvent[] }[] = [
	{ name: "messages", events: ["messageDelete", "messageEdit"] },
	{ name: "members", events: ["memberJoin", "memberLeave", "nickname", "roles"] },
	{ name: "moderation", events: ["ban", "unban", "kick", "timeout", "warns", "honeypot"] },
];
const MAX_IGNORED = 25;

const props = defineProps<{ guild: GuildDetails }>();

const { t } = useI18n();
const queryClient = useQueryClient();

const modlog = useQuery({
	queryKey: ["guild", props.guild.id, "modlog"],
	queryFn: () => getModLog(props.guild.id),
});

const form = reactive<ModLogSettings>({
	channel: null,
	events: {} as ModLogSettings["events"],
	ignoredChannels: [],
});

const reset = (settings: ModLogSettings) => {
	form.channel = settings.channel;
	form.events = { ...settings.events };
	form.ignoredChannels = [...settings.ignoredChannels];
};

watch(
	() => modlog.data.value?.settings,
	settings => settings && reset(settings),
	{ immediate: true },
);

const isDirty = computed(
	() => !!modlog.data.value && JSON.stringify(form) !== JSON.stringify(modlog.data.value.settings),
);

const channelName = (id: string) => props.guild.channels.find(c => c.id === id)?.name ?? id;

const freeChannels = computed(() => props.guild.channels.filter(c => !form.ignoredChannels.includes(c.id)));

// The select only serves to pick a channel, it goes back to empty right after
const toIgnore = ref<string | null>(null);
watch(toIgnore, id => {
	if (!id) return;

	form.ignoredChannels.push(id);
	toIgnore.value = null;
});

const unignore = (id: string) => (form.ignoredChannels = form.ignoredChannels.filter(c => c !== id));

const save = useMutation({
	mutationFn: () => updateModLog(props.guild.id, form),
	onSuccess: async () => {
		toast.success(t("modlog.saved"));
		await queryClient.invalidateQueries({ queryKey: ["guild", props.guild.id, "modlog"] });
	},
	onError: error => toast.error(getErrorMessage(error)),
});
</script>

<template>
	<ErrorState v-if="modlog.isError.value" :error="modlog.error.value" @retry="modlog.refetch()" />
	<Skeleton v-else-if="modlog.isPending.value" class="h-64" />

	<form v-else-if="modlog.data.value" class="space-y-6" @submit.prevent="save.mutate()">
		<section class="hud-panel space-y-4 p-4">
			<div>
				<h2 class="hud-title text-lg">{{ $t("modlog.title") }}</h2>
				<p class="text-sm text-muted-foreground">{{ $t("modlog.hint") }}</p>
			</div>

			<div class="max-w-sm space-y-2">
				<Label for="modlog-channel">{{ $t("modlog.channel") }}</Label>
				<ChannelSelect id="modlog-channel" v-model="form.channel" :channels="guild.channels" nullable />
			</div>

			<p
				v-if="!modlog.data.value.canViewAuditLog"
				class="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400"
			>
				<TriangleAlert class="mt-0.5 size-4 shrink-0" />
				{{ $t("modlog.noAuditLog") }}
			</p>
		</section>

		<section class="hud-panel grid gap-6 p-4 md:grid-cols-3">
			<div v-for="group in GROUPS" :key="group.name" class="space-y-2">
				<h3 class="font-medium">{{ $t(`modlog.groups.${group.name}`) }}</h3>
				<Label v-for="event in group.events" :key="event" class="flex items-center gap-2 font-normal">
					<input v-model="form.events[event]" type="checkbox" class="accent-hl" />
					{{ $t(`modlog.events.${event}`) }}
				</Label>
			</div>
		</section>

		<section class="hud-panel space-y-3 p-4">
			<div>
				<h2 class="hud-title text-lg">{{ $t("modlog.ignoredTitle") }}</h2>
				<p class="text-sm text-muted-foreground">{{ $t("modlog.ignoredHint") }}</p>
			</div>

			<div v-if="form.ignoredChannels.length" class="flex flex-wrap gap-2">
				<span
					v-for="id in form.ignoredChannels"
					:key="id"
					class="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-sm"
				>
					#{{ channelName(id) }}
					<button
						type="button"
						class="text-muted-foreground hover:text-foreground"
						:aria-label="$t('common.delete')"
						@click="unignore(id)"
					>
						<X class="size-3.5" />
					</button>
				</span>
			</div>

			<div class="max-w-sm">
				<ChannelSelect
					v-model="toIgnore"
					:channels="freeChannels"
					:disabled="form.ignoredChannels.length >= MAX_IGNORED"
				/>
			</div>
		</section>

		<div class="flex justify-end gap-2">
			<Button type="button" variant="ghost" :disabled="!isDirty" @click="reset(modlog.data.value.settings)">
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
