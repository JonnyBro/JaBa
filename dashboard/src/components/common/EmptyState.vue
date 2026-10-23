<script setup lang="ts">
import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "vue";

const props = defineProps<{
	title: string;
	description?: string;
	class?: HTMLAttributes["class"];
}>();
</script>

<template>
	<div
		:class="
			cn(
				'flex flex-col items-center justify-center gap-2 border border-dashed px-6 py-12 text-center',
				props.class,
			)
		"
	>
		<p class="font-hud text-lg">{{ title }}</p>
		<p v-if="description" class="max-w-md text-muted-foreground">{{ description }}</p>
		<slot />
	</div>
</template>
