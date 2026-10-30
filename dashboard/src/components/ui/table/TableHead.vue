<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

const props = defineProps<{
	class?: HTMLAttributes["class"];
}>();
</script>

<template>
	<th
		data-slot="table-head"
		:class="
			cn(
				'font-hud text-muted-foreground h-9 px-3 text-left align-middle text-sm whitespace-nowrap has-[[role=checkbox]]:pr-0 *:[[role=checkbox]]:translate-y-0.5',
				props.class,
			)
		"
	>
		<slot />
	</th>
</template>
