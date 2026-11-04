<script setup lang="ts">
import { sendMessage } from "@/api";
import type { GuildDetails, MessageBlock } from "@/api/types";
import BlocksEditor from "@/components/server/BlocksEditor.vue";
import ChannelSelect from "@/components/server/ChannelSelect.vue";
import MessagePreview from "@/components/server/MessagePreview.vue";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cleanBlocks } from "@/lib/blocks";
import { getErrorMessage } from "@/plugins/axios";
import { LoaderCircle, Send } from "@lucide/vue";
import { useMutation } from "@tanstack/vue-query";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";

const props = defineProps<{ guild: GuildDetails }>();

const { t } = useI18n();

const channelId = ref<string | null>(null);
const useColor = ref(true);
const color = ref(props.guild.embedColor ?? "#5865F2");
const mentions = ref(false);
const blocks = ref<MessageBlock[]>([{ type: "text", content: "" }]);

const accent = computed(() => (useColor.value ? color.value : null));

const cleaned = computed(() => cleanBlocks(blocks.value));

const send = useMutation({
	mutationFn: () =>
		sendMessage(props.guild.id, {
			channelId: channelId.value!,
			blocks: cleaned.value,
			color: accent.value,
			mentions: mentions.value,
		}),
	onSuccess: ({ url }) =>
		toast.success(t("messages.sent"), { action: { label: t("common.open"), onClick: () => window.open(url) } }),
	onError: error => toast.error(getErrorMessage(error)),
});
</script>

<template>
	<div class="grid gap-6 lg:grid-cols-2">
		<form class="space-y-4" @submit.prevent="send.mutate()">
			<div class="hud-panel grid gap-4 p-4 sm:grid-cols-2">
				<div class="space-y-2 sm:col-span-2">
					<Label for="message-channel">{{ $t("messages.channel") }}</Label>
					<ChannelSelect id="message-channel" v-model="channelId" :channels="guild.channels" />
				</div>
				<Label class="flex items-center gap-2 font-normal">
					<input v-model="useColor" type="checkbox" class="accent-hl" />
					{{ $t("messages.color") }}
					<input
						v-if="useColor"
						v-model="color"
						type="color"
						class="h-6 w-10 cursor-pointer bg-transparent"
					/>
				</Label>
				<Label class="flex items-center gap-2 font-normal">
					<input v-model="mentions" type="checkbox" class="accent-hl" />
					{{ $t("messages.mentions") }}
				</Label>
			</div>

			<BlocksEditor v-model="blocks">
				<Button type="submit" class="ml-auto" :disabled="!channelId || !cleaned.length || send.isPending.value">
					<LoaderCircle v-if="send.isPending.value" class="animate-spin" />
					<Send v-else />
					{{ $t("messages.send") }}
				</Button>
			</BlocksEditor>
		</form>

		<div class="lg:sticky lg:top-20 lg:self-start">
			<MessagePreview :blocks="cleaned" :color="accent" />
		</div>
	</div>
</template>
