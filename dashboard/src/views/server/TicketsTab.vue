<script setup lang="ts">
import { getTickets, sendTicketPanel, updateTicketSettings } from "@/api";
import type { GuildDetails, TicketSettings } from "@/api/types";
import ErrorState from "@/components/common/ErrorState.vue";
import ChannelSelect from "@/components/server/ChannelSelect.vue";
import MessagePreview from "@/components/server/MessagePreview.vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/plugins/axios";
import { Skeleton } from "@/components/ui/skeleton";
import { LoaderCircle, Save, Send } from "@lucide/vue";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";

const MAX_SUPPORT_ROLES = 5;

const props = defineProps<{ guild: GuildDetails }>();

const { t } = useI18n();
const queryClient = useQueryClient();

const tickets = useQuery({
	queryKey: ["guild", props.guild.id, "tickets"],
	queryFn: () => getTickets(props.guild.id),
});

const settings = reactive<TicketSettings>({ supportRoles: [], logChannel: null, transcriptDm: false });

const reset = (saved: TicketSettings) => {
	settings.supportRoles = [...saved.supportRoles];
	settings.logChannel = saved.logChannel;
	settings.transcriptDm = saved.transcriptDm;
};

watch(
	() => tickets.data.value?.settings,
	saved => saved && reset(saved),
	{ immediate: true },
);

const isDirty = computed(
	() => !!tickets.data.value && JSON.stringify(settings) !== JSON.stringify(tickets.data.value.settings),
);

const toggleRole = (id: string, on: boolean) => {
	settings.supportRoles = on ? [...settings.supportRoles, id] : settings.supportRoles.filter(roleId => roleId !== id);
};

const save = useMutation({
	mutationFn: () => updateTicketSettings(props.guild.id, settings),
	onSuccess: async () => {
		toast.success(t("tickets.saved"));
		await queryClient.invalidateQueries({ queryKey: ["guild", props.guild.id, "tickets"] });
	},
	onError: error => toast.error(getErrorMessage(error)),
});

const channelId = ref<string | null>(null);
const text = ref("");
const label = ref("");
const emoji = ref("");

const canSend = computed(() => Boolean(channelId.value && text.value.trim() && label.value.trim()));

const send = useMutation({
	mutationFn: () =>
		sendTicketPanel(props.guild.id, {
			channelId: channelId.value!,
			text: text.value,
			label: label.value,
			emoji: emoji.value || undefined,
		}),
	onSuccess: ({ url }) =>
		toast.success(t("tickets.sent"), { action: { label: t("common.open"), onClick: () => window.open(url) } }),
	onError: error => toast.error(getErrorMessage(error)),
});
</script>

<template>
	<div class="space-y-6">
		<ErrorState v-if="tickets.isError.value" :error="tickets.error.value" @retry="tickets.refetch()" />
		<Skeleton v-else-if="tickets.isPending.value" class="h-48" />
		<form v-else-if="tickets.data.value" class="hud-panel space-y-4 p-4" @submit.prevent="save.mutate()">
			<h2 class="hud-title text-lg">{{ $t("tickets.settingsTitle") }}</h2>

			<div class="space-y-2">
				<Label>{{ $t("tickets.supportRoles") }}</Label>
				<p class="text-sm text-muted-foreground">
					{{ $t("tickets.supportRolesHint", { max: MAX_SUPPORT_ROLES }) }}
				</p>
				<div class="grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
					<Label
						v-for="role in tickets.data.value.roles"
						:key="role.id"
						class="flex items-center gap-2 rounded-md border px-3 py-2 font-normal"
					>
						<input
							type="checkbox"
							class="accent-hl"
							:checked="settings.supportRoles.includes(role.id)"
							:disabled="
								!settings.supportRoles.includes(role.id) &&
								settings.supportRoles.length >= MAX_SUPPORT_ROLES
							"
							@change="toggleRole(role.id, ($event.target as HTMLInputElement).checked)"
						/>
						<span class="size-2.5 shrink-0 rounded-full" :style="{ backgroundColor: role.color }" />
						<span class="truncate">{{ role.name }}</span>
					</Label>
				</div>
			</div>

			<div class="grid gap-4 sm:grid-cols-2">
				<div class="space-y-2">
					<Label for="ticket-log">{{ $t("tickets.logChannel") }}</Label>
					<ChannelSelect id="ticket-log" v-model="settings.logChannel" :channels="guild.channels" nullable />
					<p class="text-xs text-muted-foreground">{{ $t("tickets.logChannelHint") }}</p>
				</div>
				<Label class="flex items-center gap-2 font-normal sm:self-center">
					<input v-model="settings.transcriptDm" type="checkbox" class="accent-hl" />
					{{ $t("tickets.transcriptDm") }}
				</Label>
			</div>

			<div class="flex justify-end gap-2">
				<Button type="button" variant="ghost" :disabled="!isDirty" @click="reset(tickets.data.value.settings)">
					{{ $t("common.cancel") }}
				</Button>
				<Button type="submit" :disabled="!isDirty || save.isPending.value">
					<LoaderCircle v-if="save.isPending.value" class="animate-spin" />
					<Save v-else />
					{{ $t("common.save") }}
				</Button>
			</div>
		</form>

		<div class="grid gap-6 lg:grid-cols-2">
			<form class="hud-panel space-y-4 p-4" @submit.prevent="send.mutate()">
				<p class="text-muted-foreground">{{ $t("tickets.intro") }}</p>

				<div class="space-y-2">
					<Label for="ticket-channel">{{ $t("tickets.channel") }}</Label>
					<ChannelSelect id="ticket-channel" v-model="channelId" :channels="guild.channels" />
				</div>

				<div class="space-y-2">
					<Label for="ticket-text">{{ $t("tickets.text") }}</Label>
					<textarea
						id="ticket-text"
						v-model="text"
						rows="6"
						maxlength="4000"
						:placeholder="$t('tickets.textPlaceholder')"
						class="w-full resize-y rounded-md border border-input bg-card px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-hl"
					/>
				</div>

				<div class="grid grid-cols-[1fr_6rem] gap-3">
					<div class="space-y-2">
						<Label for="ticket-label">{{ $t("tickets.label") }}</Label>
						<Input
							id="ticket-label"
							v-model="label"
							maxlength="80"
							:placeholder="$t('tickets.labelPlaceholder')"
						/>
					</div>
					<div class="space-y-2">
						<Label for="ticket-emoji">{{ $t("tickets.emoji") }}</Label>
						<Input id="ticket-emoji" v-model="emoji" maxlength="64" placeholder="🎫" />
					</div>
				</div>

				<div class="flex justify-end">
					<Button type="submit" :disabled="!canSend || send.isPending.value">
						<LoaderCircle v-if="send.isPending.value" class="animate-spin" />
						<Send v-else />
						{{ $t("tickets.send") }}
					</Button>
				</div>
			</form>

			<MessagePreview
				:blocks="[{ type: 'text', content: text || $t('tickets.textPlaceholder') }]"
				:color="guild.embedColor"
			>
				<span class="inline-block rounded bg-[rgb(36_128_70)] px-3 py-1.5 text-white">
					{{ emoji }} {{ label || $t("tickets.labelPlaceholder") }}
				</span>
			</MessagePreview>
		</div>
	</div>
</template>
