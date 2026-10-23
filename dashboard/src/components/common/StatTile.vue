<script setup lang="ts">
import HudIcon, { type HudIconName } from "@/components/icons/HudIcon.vue";
import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "vue";
import Hint from "./Hint.vue";

const props = defineProps<{
	label: string;
	value: string | number;
	hint?: string;
	/** Shown on hover, explains what the number means */
	tip?: string;
	icon?: HudIconName;
	class?: HTMLAttributes["class"];
}>();
</script>

<template>
	<Hint :text="tip">
		<div
			:class="cn('panel flex flex-col gap-1 px-4 py-3', tip && 'cursor-help', props.class)"
			:tabindex="tip ? 0 : undefined"
		>
			<span class="flex items-center gap-1.5 truncate font-display text-sm text-muted-foreground">
				<HudIcon v-if="icon" :name="icon" class="size-3.5" />
				{{ label }}
			</span>
			<span class="truncate font-display text-3xl leading-none">
				<slot>{{ value }}</slot>
			</span>
			<span v-if="hint" class="truncate text-sm text-muted-foreground">{{ hint }}</span>
		</div>
	</Hint>
</template>
