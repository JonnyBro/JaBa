<script setup lang="ts">
import { sendTicketPanel } from "@/api";
import type { GuildDetails } from "@/api/types";
import ChannelSelect from "@/components/server/ChannelSelect.vue";
import MessagePreview from "@/components/server/MessagePreview.vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/plugins/axios";
import { useMutation } from "@tanstack/vue-query";
import { LoaderCircle, Send } from "lucide-vue-next";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";

const props = defineProps<{ guild: GuildDetails }>();

const { t } = useI18n();

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
	<div class="grid gap-6 lg:grid-cols-2">
		<form class="panel space-y-4 p-4" @submit.prevent="send.mutate()">
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
</template>
