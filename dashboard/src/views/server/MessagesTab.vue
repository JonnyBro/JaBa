<script setup lang="ts">
import { sendMessage } from "@/api";
import type { GuildDetails, MessageBlock } from "@/api/types";
import ChannelSelect from "@/components/server/ChannelSelect.vue";
import MessagePreview from "@/components/server/MessagePreview.vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/plugins/axios";
import { useMutation } from "@tanstack/vue-query";
import {
	ArrowDown,
	ArrowUp,
	Image,
	LoaderCircle,
	Minus,
	MousePointerClick,
	Plus,
	Send,
	Trash2,
	Type,
} from "lucide-vue-next";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";

const MAX_GALLERY_ITEMS = 10;
const MAX_BUTTONS = 5;

const props = defineProps<{ guild: GuildDetails }>();

const { t } = useI18n();

const channelId = ref<string | null>(null);
const useColor = ref(true);
const color = ref(props.guild.embedColor ?? "#5865F2");
const mentions = ref(false);
const blocks = ref<MessageBlock[]>([{ type: "text", content: "" }]);

const templates: Record<MessageBlock["type"], () => MessageBlock> = {
	text: () => ({ type: "text", content: "" }),
	separator: () => ({ type: "separator", divider: true, large: false }),
	gallery: () => ({ type: "gallery", urls: [""] }),
	buttons: () => ({ type: "buttons", buttons: [{ label: "", url: "" }] }),
};

const addButtons = [
	{ type: "text", icon: Type },
	{ type: "separator", icon: Minus },
	{ type: "gallery", icon: Image },
	{ type: "buttons", icon: MousePointerClick },
] as const;

const add = (type: MessageBlock["type"]) => blocks.value.push(templates[type]());
const remove = (index: number) => blocks.value.splice(index, 1);
const move = (index: number, by: number) => {
	const [block] = blocks.value.splice(index, 1);
	blocks.value.splice(index + by, 0, block);
};

const accent = computed(() => (useColor.value ? color.value : null));

// Empty inputs are dropped instead of failing the request
const cleaned = computed(() =>
	blocks.value
		.map(block => {
			if (block.type === "gallery") return { ...block, urls: block.urls.map(u => u.trim()).filter(Boolean) };
			if (block.type === "buttons")
				return { ...block, buttons: block.buttons.filter(b => b.label.trim() || b.url.trim()) };

			return block;
		})
		.filter(block => {
			if (block.type === "text") return block.content.trim();
			if (block.type === "gallery") return block.urls.length;
			if (block.type === "buttons") return block.buttons.length;

			return true;
		}),
);

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
					<input v-model="useColor" type="checkbox" class="accent-[var(--hl)]" />
					{{ $t("messages.color") }}
					<input
						v-if="useColor"
						v-model="color"
						type="color"
						class="h-6 w-10 cursor-pointer bg-transparent"
					/>
				</Label>
				<Label class="flex items-center gap-2 font-normal">
					<input v-model="mentions" type="checkbox" class="accent-[var(--hl)]" />
					{{ $t("messages.mentions") }}
				</Label>
			</div>

			<div v-for="(block, i) in blocks" :key="i" class="hud-panel space-y-3 p-3">
				<div class="flex items-center gap-1">
					<span class="mr-auto font-hud text-sm text-muted-foreground">
						{{ $t(`messages.blocks.${block.type}`) }}
					</span>
					<Button type="button" variant="ghost" size="icon-sm" :disabled="i === 0" @click="move(i, -1)">
						<ArrowUp />
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						:disabled="i === blocks.length - 1"
						@click="move(i, 1)"
					>
						<ArrowDown />
					</Button>
					<Button type="button" variant="ghost" size="icon-sm" @click="remove(i)">
						<Trash2 />
					</Button>
				</div>

				<textarea
					v-if="block.type === 'text'"
					v-model="block.content"
					rows="4"
					maxlength="4000"
					:placeholder="$t('messages.textPlaceholder')"
					class="w-full resize-y rounded-md border border-input bg-card px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-hl"
				/>

				<div v-else-if="block.type === 'separator'" class="flex flex-wrap gap-4">
					<Label class="flex items-center gap-2 font-normal">
						<input v-model="block.divider" type="checkbox" class="accent-[var(--hl)]" />
						{{ $t("messages.divider") }}
					</Label>
					<Label class="flex items-center gap-2 font-normal">
						<input v-model="block.large" type="checkbox" class="accent-[var(--hl)]" />
						{{ $t("messages.large") }}
					</Label>
				</div>

				<div v-else-if="block.type === 'gallery'" class="space-y-2">
					<div v-for="(_url, j) in block.urls" :key="j" class="flex gap-2">
						<Input v-model="block.urls[j]" type="url" placeholder="https://…/image.png" />
						<Button type="button" variant="ghost" size="icon" @click="block.urls.splice(j, 1)">
							<Trash2 />
						</Button>
					</div>
					<Button
						type="button"
						variant="outline"
						size="sm"
						:disabled="block.urls.length >= MAX_GALLERY_ITEMS"
						@click="block.urls.push('')"
					>
						<Plus />
						{{ $t("messages.addImage") }}
					</Button>
				</div>

				<div v-else-if="block.type === 'buttons'" class="space-y-2">
					<div v-for="(button, j) in block.buttons" :key="j" class="grid grid-cols-[1fr_1.5fr_auto] gap-2">
						<Input v-model="button.label" maxlength="80" :placeholder="$t('messages.buttonLabel')" />
						<Input v-model="button.url" type="url" placeholder="https://…" />
						<Button type="button" variant="ghost" size="icon" @click="block.buttons.splice(j, 1)">
							<Trash2 />
						</Button>
					</div>
					<Button
						type="button"
						variant="outline"
						size="sm"
						:disabled="block.buttons.length >= MAX_BUTTONS"
						@click="block.buttons.push({ label: '', url: '' })"
					>
						<Plus />
						{{ $t("messages.addButton") }}
					</Button>
				</div>
			</div>

			<div class="flex flex-wrap items-center gap-2">
				<Button
					v-for="item in addButtons"
					:key="item.type"
					type="button"
					variant="outline"
					size="sm"
					@click="add(item.type)"
				>
					<component :is="item.icon" />
					{{ $t(`messages.blocks.${item.type}`) }}
				</Button>
				<Button type="submit" class="ml-auto" :disabled="!channelId || !cleaned.length || send.isPending.value">
					<LoaderCircle v-if="send.isPending.value" class="animate-spin" />
					<Send v-else />
					{{ $t("messages.send") }}
				</Button>
			</div>
		</form>

		<div class="lg:sticky lg:top-20 lg:self-start">
			<MessagePreview :blocks="cleaned" :color="accent" />
		</div>
	</div>
</template>
