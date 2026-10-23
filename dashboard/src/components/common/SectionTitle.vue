<script setup lang="ts">
defineProps<{ title: string; subtitle?: string }>();
</script>

<template>
	<div class="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
		<div class="space-y-1.5">
			<h2 class="hud-title">{{ title }}</h2>
			<p v-if="subtitle" class="text-muted-foreground">{{ subtitle }}</p>
		</div>
		<slot />
	</div>
</template>
