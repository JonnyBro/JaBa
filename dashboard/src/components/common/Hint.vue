<script setup lang="ts">
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Tooltip around a single element. Without text it renders the element as is
defineProps<{ text?: string | null; side?: "top" | "bottom" | "left" | "right" }>();
</script>

<template>
	<Tooltip v-if="text">
		<TooltipTrigger as-child>
			<slot />
		</TooltipTrigger>
		<TooltipContent :side="side" class="max-w-64">{{ text }}</TooltipContent>
	</Tooltip>
	<slot v-else />
</template>
