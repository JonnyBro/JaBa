<script setup lang="ts">
import { getShop, updateMemberInventory } from "@/api";
import type { InventoryEntry } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getErrorMessage } from "@/plugins/axios";
import { LoaderCircle, Save, X } from "@lucide/vue";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";

const MAX_QUANTITY = 1_000_000;

const props = defineProps<{ guildId: string; userId: string; inventory: InventoryEntry[] }>();

const { t } = useI18n();
const queryClient = useQueryClient();

const shop = useQuery({
	queryKey: computed(() => ["guild", props.guildId, "shop"]),
	queryFn: () => getShop(props.guildId),
});

// Roles are given right away when bought, only these can sit in an inventory
const holdable = computed(
	() => shop.data.value?.items.filter(item => item.type === "item" || item.type === "consumable") ?? [],
);
const itemById = computed(() => new Map(holdable.value.map(item => [item.id, item])));

const rows = ref<InventoryEntry[]>([]);

watch(
	() => props.inventory,
	value => (rows.value = value.map(entry => ({ ...entry }))),
	{ immediate: true, deep: true },
);

const payload = computed(() =>
	rows.value
		.map(row => ({ item: row.item, quantity: Number(row.quantity) }))
		.filter(row => Number.isInteger(row.quantity) && row.quantity > 0),
);

const isValid = computed(() =>
	rows.value.every(
		row => Number.isInteger(Number(row.quantity)) && row.quantity >= 0 && row.quantity <= MAX_QUANTITY,
	),
);
const isDirty = computed(() => JSON.stringify(payload.value) !== JSON.stringify(props.inventory));

const unused = computed(() => holdable.value.filter(item => !rows.value.some(row => row.item === item.id)));

// The select only serves to pick an item, it goes back to empty right after
const toAdd = ref("");
watch(toAdd, id => {
	if (!id) return;

	rows.value.push({ item: id, quantity: 1 });
	toAdd.value = "";
});

const removeRow = (id: string) => (rows.value = rows.value.filter(row => row.item !== id));

const save = useMutation({
	mutationFn: () => updateMemberInventory(props.guildId, props.userId, payload.value),
	onSuccess: async () => {
		toast.success(t("members.inventorySaved"));
		await queryClient.invalidateQueries({ queryKey: ["guild", props.guildId, "member", props.userId] });
	},
	onError: error => toast.error(getErrorMessage(error)),
});
</script>

<template>
	<section class="space-y-3">
		<h3 class="hud-title text-lg">{{ $t("members.inventory") }}</h3>

		<p v-if="!rows.length" class="text-muted-foreground">{{ $t("members.inventoryEmpty") }}</p>
		<ul v-else class="divide-y border">
			<li v-for="row in rows" :key="row.item" class="flex items-center gap-2 px-3 py-2 text-sm">
				<span class="min-w-0 flex-1 truncate">
					{{ itemById.get(row.item)?.emoji }} {{ itemById.get(row.item)?.name ?? row.item }}
				</span>
				<Input
					v-model.number="row.quantity"
					type="number"
					min="0"
					:max="MAX_QUANTITY"
					step="1"
					class="h-8 w-24"
					:aria-label="$t('members.quantity')"
				/>
				<button
					type="button"
					class="text-muted-foreground hover:text-foreground"
					:aria-label="$t('common.delete')"
					@click="removeRow(row.item)"
				>
					<X class="size-4" />
				</button>
			</li>
		</ul>

		<div class="flex flex-wrap items-center justify-between gap-2">
			<Select v-model="toAdd" :disabled="!unused.length">
				<SelectTrigger class="w-full sm:w-56">
					<SelectValue>
						{{ holdable.length ? $t("members.giveItem") : $t("members.noShopItems") }}
					</SelectValue>
				</SelectTrigger>
				<SelectContent>
					<SelectItem v-for="item in unused" :key="item.id" :value="item.id">
						{{ item.emoji }} {{ item.name }}
					</SelectItem>
				</SelectContent>
			</Select>
			<Button :disabled="!isDirty || !isValid || save.isPending.value" @click="save.mutate()">
				<LoaderCircle v-if="save.isPending.value" class="animate-spin" />
				<Save v-else />
				{{ $t("common.save") }}
			</Button>
		</div>
	</section>
</template>
