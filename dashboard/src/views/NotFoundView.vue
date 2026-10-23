<script setup lang="ts">
import { Button } from "@/components/ui/button";
</script>

<template>
	<div class="flex flex-col items-center justify-center gap-4 py-20 text-center">
		<p class="font-display text-7xl">404</p>
		<p class="font-display text-lg text-muted-foreground">{{ $t("notFound.text") }}</p>
		<Button as-child variant="outline">
			<RouterLink :to="{ name: 'home' }">{{ $t("common.backHome") }}</RouterLink>
		</Button>
	</div>
</template>
