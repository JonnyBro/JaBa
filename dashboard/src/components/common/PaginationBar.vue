<script setup lang="ts">
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import { ChevronLeft, ChevronRight } from "lucide-vue-next";

defineProps<{
	total: number;
	perPage: number;
}>();

const page = defineModel<number>({ required: true });
</script>

<template>
	<Pagination
		v-if="total > perPage"
		v-slot="{ page: current }"
		v-model:page="page"
		:total="total"
		:items-per-page="perPage"
		:sibling-count="1"
		show-edges
	>
		<PaginationContent v-slot="{ items }">
			<PaginationPrevious>
				<ChevronLeft />
				<span class="hidden sm:block">{{ $t("common.previous") }}</span>
			</PaginationPrevious>
			<template v-for="(item, index) in items" :key="index">
				<PaginationItem v-if="item.type === 'page'" :value="item.value" :is-active="item.value === current">
					{{ item.value }}
				</PaginationItem>
				<PaginationEllipsis v-else :index="index" />
			</template>
			<PaginationNext>
				<span class="hidden sm:block">{{ $t("common.next") }}</span>
				<ChevronRight />
			</PaginationNext>
		</PaginationContent>
	</Pagination>
</template>
