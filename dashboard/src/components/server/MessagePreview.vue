<script setup lang="ts">
import type { MessageBlock } from "@/api/types";
import { renderDiscordMarkdown } from "@/lib/markdown";

import { computed } from "vue";

const props = defineProps<{ blocks: MessageBlock[]; color: string | null; thumbnail?: string | null }>();

// The bot puts the thumbnail next to the first text block, the same as a Discord section
const thumbnailIndex = computed(() => (props.thumbnail ? props.blocks.findIndex(b => b.type === "text") : -1));
</script>

<template>
	<div class="space-y-1.5">
		<p class="font-hud text-sm text-muted-foreground">{{ $t("messages.preview") }}</p>
		<div
			class="space-y-2 border border-l-4 bg-[rgb(43_45_49)] p-3 text-sm text-[rgb(219_222_225)]"
			:style="{ borderLeftColor: color ?? 'transparent' }"
		>
			<template v-for="(block, i) in blocks" :key="i">
				<div v-if="block.type === 'text'" class="flex gap-3">
					<!-- eslint-disable-next-line vue/no-v-html -->
					<div
						class="min-w-0 flex-1 space-y-0.5 wrap-break-word"
						v-html="renderDiscordMarkdown(block.content)"
					/>
					<img
						v-if="i === thumbnailIndex"
						:src="thumbnail!"
						alt=""
						class="size-16 shrink-0 rounded-md object-cover"
					/>
				</div>
				<hr
					v-else-if="block.type === 'separator'"
					:class="[block.divider ? 'border-white/15' : 'border-transparent', block.large ? 'my-4' : 'my-1']"
				/>
				<div v-else-if="block.type === 'gallery'" class="grid grid-cols-2 gap-1">
					<img
						v-for="url in block.urls.filter(Boolean)"
						:key="url"
						:src="url"
						alt=""
						class="max-h-48 w-full object-cover"
						:class="block.urls.length === 1 && 'col-span-2'"
					/>
				</div>
				<div v-else-if="block.type === 'buttons'" class="flex flex-wrap gap-2">
					<span
						v-for="(button, j) in block.buttons"
						:key="j"
						class="rounded bg-[rgb(78_80_88)] px-3 py-1.5 text-white"
					>
						{{ button.label || "…" }} ↗
					</span>
				</div>
			</template>
			<slot />
		</div>
	</div>
</template>
