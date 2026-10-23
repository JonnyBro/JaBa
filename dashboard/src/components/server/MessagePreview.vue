<script setup lang="ts">
import type { MessageBlock } from "@/api/types";
import { renderDiscordMarkdown } from "@/lib/markdown";

defineProps<{ blocks: MessageBlock[]; color: string | null }>();
</script>

<template>
	<div class="space-y-1.5">
		<p class="font-display text-sm text-muted-foreground">{{ $t("messages.preview") }}</p>
		<div
			class="space-y-2 border border-l-4 bg-[rgb(43_45_49)] p-3 text-sm text-[rgb(219_222_225)]"
			:style="{ borderLeftColor: color ?? 'transparent' }"
		>
			<template v-for="(block, i) in blocks" :key="i">
				<!-- eslint-disable-next-line vue/no-v-html -->
				<div
					v-if="block.type === 'text'"
					class="space-y-0.5 break-words"
					v-html="renderDiscordMarkdown(block.content)"
				/>
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
