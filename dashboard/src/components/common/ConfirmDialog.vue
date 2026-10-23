<script setup lang="ts">
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { LoaderCircle } from "lucide-vue-next";

withDefaults(
	defineProps<{
		title: string;
		description?: string;
		confirmText?: string;
		destructive?: boolean;
		loading?: boolean;
	}>(),
	{ destructive: true },
);

const open = defineModel<boolean>("open", { required: true });
defineEmits<{ confirm: [] }>();
</script>

<template>
	<AlertDialog v-model:open="open">
		<AlertDialogContent>
			<AlertDialogHeader>
				<AlertDialogTitle>{{ title }}</AlertDialogTitle>
				<AlertDialogDescription v-if="description">{{ description }}</AlertDialogDescription>
			</AlertDialogHeader>
			<slot />
			<AlertDialogFooter>
				<AlertDialogCancel :disabled="loading">{{ $t("common.cancel") }}</AlertDialogCancel>
				<Button
					:variant="destructive ? 'destructive' : 'default'"
					:disabled="loading"
					@click="$emit('confirm')"
				>
					<LoaderCircle v-if="loading" class="animate-spin" />
					{{ confirmText ?? $t("common.confirm") }}
				</Button>
			</AlertDialogFooter>
		</AlertDialogContent>
	</AlertDialog>
</template>
