<script setup lang="ts">
import { createShopItem, deleteShopItem, getShop, updateShopItem } from "@/api";
import type { GuildDetails, ShopItem, ShopItemInput, ShopItemType } from "@/api/types";
import ConfirmDialog from "@/components/common/ConfirmDialog.vue";
import EmptyState from "@/components/common/EmptyState.vue";
import ErrorState from "@/components/common/ErrorState.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatNumber } from "@/lib/format";
import { getErrorMessage } from "@/plugins/axios";
import { LoaderCircle, Pencil, Plus, Save, Search, Trash2 } from "@lucide/vue";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";

const TYPES: ShopItemType[] = ["role", "temp_role", "item", "consumable"];

const props = defineProps<{ guild: GuildDetails }>();

const { t } = useI18n();
const queryClient = useQueryClient();

const shop = useQuery({
	queryKey: ["guild", props.guild.id, "shop"],
	queryFn: () => getShop(props.guild.id),
});

const search = ref("");

const filtered = computed(() => {
	const items = shop.data.value?.items ?? [];
	const query = search.value.trim().toLowerCase();
	if (!query) return items;

	return items.filter(item =>
		[item.name, item.description, t(`shop.types.${item.type}`), typeDetails(item)].some(text =>
			text.toLowerCase().includes(query),
		),
	);
});

const roleById = computed(() => new Map(shop.data.value?.roles.map(role => [role.id, role]) ?? []));
const isFull = computed(() => (shop.data.value?.items.length ?? 0) >= (shop.data.value?.max ?? Infinity));

// Vue turns number inputs into numbers, but an emptied one gives back "", which here means no limit
type NumberField = number | "";

type Form = Omit<ShopItemInput, "emoji" | "price" | "durationHours" | "stock" | "perUserLimit" | "requiredLevel"> & {
	emoji: string;
	price: NumberField;
	durationHours: NumberField;
	stock: NumberField;
	perUserLimit: NumberField;
	requiredLevel: NumberField;
};

const EMPTY_FORM: Form = {
	name: "",
	description: "",
	emoji: "",
	type: "item",
	price: 100,
	roleId: null,
	durationHours: 24,
	effect: null,
	stock: "",
	perUserLimit: "",
	requiredLevel: 0,
	sellable: false,
	enabled: true,
};

const form = reactive<Form>({ ...EMPTY_FORM });
const editingId = ref<string | null>(null);
const formOpen = ref(false);

const needsRole = computed(() => form.type === "role" || form.type === "temp_role");
const needsDuration = computed(() => form.type === "temp_role" || form.type === "consumable");
const isInventory = computed(() => form.type === "item" || form.type === "consumable");

const toField = (value: number | null): NumberField => value ?? "";
const toNumber = (value: NumberField) => (value === "" ? null : value);

const openCreate = () => {
	Object.assign(form, EMPTY_FORM, { effect: shop.data.value?.effects[0] ?? null });
	editingId.value = null;
	formOpen.value = true;
};

const openEdit = (item: ShopItem) => {
	Object.assign(form, {
		...item,
		emoji: item.emoji ?? "",
		price: item.price,
		durationHours: item.durationHours ?? 24,
		effect: item.effect ?? shop.data.value?.effects[0] ?? null,
		stock: toField(item.stock),
		perUserLimit: toField(item.perUserLimit),
		requiredLevel: item.requiredLevel,
	});
	editingId.value = item.id;
	formOpen.value = true;
};

const payload = (): ShopItemInput => ({
	name: form.name,
	description: form.description,
	emoji: form.emoji.trim() || null,
	type: form.type,
	price: Number(form.price),
	roleId: needsRole.value ? form.roleId : null,
	durationHours: needsDuration.value ? toNumber(form.durationHours) : null,
	effect: form.type === "consumable" ? form.effect : null,
	stock: toNumber(form.stock),
	perUserLimit: isInventory.value ? toNumber(form.perUserLimit) : null,
	requiredLevel: Number(form.requiredLevel) || 0,
	sellable: isInventory.value && form.sellable,
	enabled: form.enabled,
});

const refresh = () => queryClient.invalidateQueries({ queryKey: ["guild", props.guild.id, "shop"] });

const save = useMutation({
	mutationFn: () =>
		editingId.value
			? updateShopItem(props.guild.id, editingId.value, payload())
			: createShopItem(props.guild.id, payload()),
	onSuccess: () => {
		toast.success(t("shop.saved"));
		formOpen.value = false;
		void refresh();
	},
	onError: error => toast.error(getErrorMessage(error)),
});

const deleting = ref<ShopItem | null>(null);
const deleteOpen = computed({
	get: () => Boolean(deleting.value),
	set: value => {
		if (!value) deleting.value = null;
	},
});

const remove = useMutation({
	mutationFn: (item: ShopItem) => deleteShopItem(props.guild.id, item.id),
	onSuccess: () => {
		toast.success(t("shop.deleted"));
		deleting.value = null;
		void refresh();
	},
	onError: error => toast.error(getErrorMessage(error)),
});

const typeDetails = (item: ShopItem) => {
	const role = item.roleId ? `@${roleById.value.get(item.roleId)?.name ?? t("common.unknown")}` : "";

	if (item.type === "role") return role;
	if (item.type === "temp_role") return `${role} · ${t("shop.hours", item.durationHours ?? 0)}`;
	if (item.type === "consumable")
		return `${t(`shop.effects.${item.effect}`)} · ${t("shop.hours", item.durationHours ?? 0)}`;

	return "";
};
</script>

<template>
	<div class="space-y-4">
		<div class="flex flex-wrap items-center justify-between gap-2">
			<p class="text-muted-foreground">
				{{ $t("shop.intro") }}
				<template v-if="shop.data.value">
					{{ $t("shop.count", { n: shop.data.value.items.length, max: shop.data.value.max }) }}
				</template>
			</p>
			<Button :disabled="!shop.data.value || isFull" @click="openCreate">
				<Plus />
				{{ $t("shop.add") }}
			</Button>
		</div>

		<ErrorState v-if="shop.isError.value" :error="shop.error.value" @retry="shop.refetch()" />
		<Skeleton v-else-if="shop.isPending.value" class="h-48" />
		<EmptyState
			v-else-if="!shop.data.value?.items.length"
			:title="$t('shop.empty')"
			:description="$t('shop.emptyText')"
		/>

		<template v-else>
			<div class="relative sm:w-72">
				<Search class="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input v-model="search" :placeholder="$t('shop.search')" class="pl-8" />
			</div>

			<EmptyState v-if="!filtered.length" :title="$t('shop.notFound')" />

			<div v-else class="hud-panel overflow-x-auto">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{{ $t("shop.item") }}</TableHead>
							<TableHead>{{ $t("shop.type") }}</TableHead>
							<TableHead class="text-right">{{ $t("shop.price") }}</TableHead>
							<TableHead class="hidden text-right sm:table-cell">{{ $t("shop.stock") }}</TableHead>
							<TableHead class="w-0" />
						</TableRow>
					</TableHeader>
					<TableBody>
						<TableRow v-for="item in filtered" :key="item.id" :class="!item.enabled && 'opacity-60'">
							<TableCell class="max-w-64">
								<p class="truncate font-medium">
									<span v-if="item.emoji" class="mr-1">{{ item.emoji }}</span
									>{{ item.name }}
								</p>
								<p v-if="item.description" class="truncate text-xs text-muted-foreground">
									{{ item.description }}
								</p>
							</TableCell>
							<TableCell>
								<div class="flex flex-wrap items-center gap-1">
									<Badge variant="secondary">{{ $t(`shop.types.${item.type}`) }}</Badge>
									<Badge v-if="!item.enabled" variant="outline">{{ $t("shop.hidden") }}</Badge>
								</div>
								<p v-if="typeDetails(item)" class="mt-1 text-xs text-muted-foreground">
									{{ typeDetails(item) }}
								</p>
							</TableCell>
							<TableCell class="text-right font-hud">{{ formatNumber(item.price) }}</TableCell>
							<TableCell class="hidden text-right sm:table-cell">
								{{ item.stock === null ? "∞" : formatNumber(item.stock) }}
							</TableCell>
							<TableCell>
								<div class="flex justify-end gap-1">
									<Button
										variant="ghost"
										size="icon"
										:aria-label="$t('common.edit')"
										@click="openEdit(item)"
									>
										<Pencil />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										:aria-label="$t('common.delete')"
										@click="deleting = item"
									>
										<Trash2 />
									</Button>
								</div>
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</div>
		</template>
	</div>

	<Dialog v-model:open="formOpen">
		<DialogContent class="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
			<DialogHeader>
				<DialogTitle>{{ editingId ? $t("shop.editTitle") : $t("shop.addTitle") }}</DialogTitle>
				<DialogDescription>{{ $t("shop.formHint") }}</DialogDescription>
			</DialogHeader>

			<form id="shop-item" class="grid gap-4 sm:grid-cols-[1fr_8rem]" @submit.prevent="save.mutate()">
				<div class="space-y-2">
					<Label for="shop-name">{{ $t("shop.name") }}</Label>
					<Input id="shop-name" v-model="form.name" maxlength="50" required />
				</div>
				<div class="space-y-2">
					<Label for="shop-emoji">{{ $t("shop.emoji") }}</Label>
					<Input id="shop-emoji" v-model="form.emoji" maxlength="64" placeholder="🏆" />
				</div>

				<div class="space-y-2 sm:col-span-2">
					<Label for="shop-description">{{ $t("shop.description") }}</Label>
					<textarea
						id="shop-description"
						v-model="form.description"
						rows="2"
						maxlength="200"
						class="w-full resize-y rounded-md border border-input bg-card px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-hl"
					/>
				</div>

				<div class="space-y-2 sm:col-span-2">
					<Label for="shop-type">{{ $t("shop.type") }}</Label>
					<Select id="shop-type" v-model="form.type">
						<SelectTrigger class="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem v-for="type in TYPES" :key="type" :value="type">
								{{ $t(`shop.types.${type}`) }}
							</SelectItem>
						</SelectContent>
					</Select>
					<p class="text-xs text-muted-foreground">{{ $t(`shop.typeHints.${form.type}`) }}</p>
				</div>

				<div v-if="needsRole" class="space-y-2 sm:col-span-2">
					<Label for="shop-role">{{ $t("shop.role") }}</Label>
					<Select id="shop-role" v-model="form.roleId">
						<SelectTrigger class="w-full">
							<SelectValue :placeholder="$t('shop.pickRole')" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem v-for="role in shop.data.value?.roles" :key="role.id" :value="role.id">
								<span class="size-2.5 shrink-0 rounded-full" :style="{ backgroundColor: role.color }" />
								<span class="truncate">{{ role.name }}</span>
							</SelectItem>
						</SelectContent>
					</Select>
					<p class="text-xs text-muted-foreground">{{ $t("shop.roleHint") }}</p>
				</div>

				<div v-if="form.type === 'consumable'" class="space-y-2">
					<Label for="shop-effect">{{ $t("shop.effect") }}</Label>
					<Select id="shop-effect" v-model="form.effect">
						<SelectTrigger class="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem v-for="effect in shop.data.value?.effects" :key="effect" :value="effect">
								{{ $t(`shop.effects.${effect}`) }}
							</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div v-if="needsDuration" class="space-y-2" :class="form.type !== 'consumable' && 'sm:col-span-2'">
					<Label for="shop-duration">{{ $t("shop.duration") }}</Label>
					<Input id="shop-duration" v-model="form.durationHours" type="number" min="1" max="8760" required />
				</div>

				<div class="space-y-2">
					<Label for="shop-price">{{ $t("shop.price") }}</Label>
					<Input id="shop-price" v-model="form.price" type="number" min="0" required />
				</div>
				<div class="space-y-2">
					<Label for="shop-level">{{ $t("shop.requiredLevel") }}</Label>
					<Input id="shop-level" v-model="form.requiredLevel" type="number" min="0" />
				</div>

				<div class="space-y-2">
					<Label for="shop-stock">{{ $t("shop.stock") }}</Label>
					<Input
						id="shop-stock"
						v-model="form.stock"
						type="number"
						min="0"
						:placeholder="$t('shop.unlimited')"
					/>
				</div>
				<div v-if="isInventory" class="space-y-2">
					<Label for="shop-limit">{{ $t("shop.perUserLimit") }}</Label>
					<Input
						id="shop-limit"
						v-model="form.perUserLimit"
						type="number"
						min="1"
						:placeholder="$t('shop.unlimited')"
					/>
				</div>

				<div class="flex flex-wrap gap-x-6 gap-y-2 sm:col-span-2">
					<Label v-if="isInventory" class="flex items-center gap-2 font-normal">
						<input v-model="form.sellable" type="checkbox" class="accent-hl" />
						{{ $t("shop.sellable") }}
					</Label>
					<Label class="flex items-center gap-2 font-normal">
						<input v-model="form.enabled" type="checkbox" class="accent-hl" />
						{{ $t("shop.enabled") }}
					</Label>
				</div>
			</form>

			<DialogFooter>
				<Button variant="outline" @click="formOpen = false">{{ $t("common.cancel") }}</Button>
				<Button type="submit" form="shop-item" :disabled="save.isPending.value">
					<LoaderCircle v-if="save.isPending.value" class="animate-spin" />
					<Save v-else />
					{{ $t("common.save") }}
				</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>

	<ConfirmDialog
		v-model:open="deleteOpen"
		:title="$t('shop.deleteTitle', { name: deleting?.name })"
		:description="$t('shop.deleteText')"
		:confirm-text="$t('common.delete')"
		:loading="remove.isPending.value"
		@confirm="deleting && remove.mutate(deleting)"
	/>
</template>
