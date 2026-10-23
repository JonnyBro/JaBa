<script setup lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "vue";

const props = defineProps<{
	name: string;
	src?: string | null;
	class?: HTMLAttributes["class"];
}>();
</script>

<template>
	<Avatar :class="cn('size-8', props.class)">
		<AvatarImage v-if="src" :src="src" :alt="name" />
		<AvatarFallback class="text-xs font-medium">{{ initials(name) }}</AvatarFallback>
	</Avatar>
</template>
