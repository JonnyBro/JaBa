<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/plugins/axios";

defineProps<{ error: unknown }>();
defineEmits<{ retry: [] }>();
</script>

<template>
	<div class="flex flex-col items-center justify-center gap-3 border border-destructive/60 px-6 py-10 text-center">
		<p class="font-hud text-lg text-destructive-foreground">{{ $t("common.loadError") }}</p>
		<p class="text-muted-foreground">{{ getErrorMessage(error) }}</p>
		<Button variant="outline" size="sm" @click="$emit('retry')">{{ $t("common.tryAgain") }}</Button>
	</div>
</template>
