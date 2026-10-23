<script setup lang="ts">
import type { TabsTriggerProps } from "reka-ui";
import type { HTMLAttributes } from "vue";
import { reactiveOmit } from "@vueuse/core";
import { cn } from "@/lib/utils";
import { TabsTrigger, useForwardProps } from "reka-ui";

const props = defineProps<TabsTriggerProps & { class?: HTMLAttributes["class"] }>();

const delegatedProps = reactiveOmit(props, "class");

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
	<TabsTrigger
		data-slot="tabs-trigger"
		:class="
			cn(
				`font-display -mb-px inline-flex h-10 items-center justify-center gap-1.5 border-b-2 border-transparent px-3 text-base whitespace-nowrap  text-muted-foreground transition-colors hover:text-hl data-[state=active]:border-hl data-[state=active]:text-foreground focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4`,
				props.class,
			)
		"
		v-bind="forwardedProps"
	>
		<slot />
	</TabsTrigger>
</template>
