<script setup lang="ts">
import { cn } from "@/lib/utils";

defineProps<{ position: number }>();

const placeColor: Record<number, string> = {
	1: "text-gold",
	2: "text-silver",
	3: "text-bronze",
};
</script>

<template>
	<span
		:class="
			cn(
				'inline-flex items-center gap-1 font-hud text-base tabular',
				placeColor[position] ?? 'text-muted-foreground',
			)
		"
	>
		{{ position }}.
	</span>
</template>
