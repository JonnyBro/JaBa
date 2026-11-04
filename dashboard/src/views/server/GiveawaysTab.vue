<script setup lang="ts">
import { createGiveaway, deleteGiveaway, endGiveaway, getGiveaways, rerollGiveaway } from "@/api";
import type { Giveaway, GuildDetails } from "@/api/types";
import ConfirmDialog from "@/components/common/ConfirmDialog.vue";
import EmptyState from "@/components/common/EmptyState.vue";
import ErrorState from "@/components/common/ErrorState.vue";
import ChannelSelect from "@/components/server/ChannelSelect.vue";
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
import { formatNumber, formatRelative } from "@/lib/format";
import { getErrorMessage } from "@/plugins/axios";
import { ExternalLink, Flag, LoaderCircle, Plus, RefreshCw, Trash2 } from "@lucide/vue";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";

const UNITS = { minutes: 1, hours: 60, days: 24 * 60 } as const;
type Unit = keyof typeof UNITS;
// reka-ui selects can't hold an empty value
const NONE = "none";

const props = defineProps<{ guild: GuildDetails }>();

const { t } = useI18n();
const queryClient = useQueryClient();

const giveaways = useQuery({
	queryKey: ["guild", props.guild.id, "giveaways"],
	queryFn: () => getGiveaways(props.guild.id),
	refetchInterval: 30_000,
});

const refresh = () => queryClient.invalidateQueries({ queryKey: ["guild", props.guild.id, "giveaways"] });

// Vue turns number inputs into numbers, but an emptied one gives back ""
const EMPTY_FORM = {
	channelId: null as string | null,
	prize: "",
	duration: 1 as number | "",
	unit: "days" as Unit,
	winners: 1 as number | "",
	credits: "" as number | "",
	itemId: NONE,
	requiredLevel: "" as number | "",
	requiredRoleId: NONE,
};

const form = reactive({ ...EMPTY_FORM });
const formOpen = ref(false);

const openCreate = () => {
	Object.assign(form, EMPTY_FORM);
	formOpen.value = true;
};

const create = useMutation({
	mutationFn: () =>
		createGiveaway(props.guild.id, {
			channelId: form.channelId!,
			prize: form.prize,
			minutes: Number(form.duration) * UNITS[form.unit],
			winners: Number(form.winners) || 1,
			credits: Number(form.credits) || 0,
			itemId: form.itemId === NONE ? null : form.itemId,
			requiredLevel: Number(form.requiredLevel) || 0,
			requiredRoleId: form.requiredRoleId === NONE ? null : form.requiredRoleId,
		}),
	onSuccess: () => {
		toast.success(t("giveaways.created"));
		formOpen.value = false;
		void refresh();
	},
	onError: error => toast.error(getErrorMessage(error)),
});

const end = useMutation({
	mutationFn: (giveaway: Giveaway) => endGiveaway(props.guild.id, giveaway.id),
	onSuccess: () => {
		toast.success(t("giveaways.endedToast"));
		void refresh();
	},
	onError: error => toast.error(getErrorMessage(error)),
});

const reroll = useMutation({
	mutationFn: (giveaway: Giveaway) => rerollGiveaway(props.guild.id, giveaway.id),
	onSuccess: ({ winner }) => {
		toast.success(t("giveaways.rerolled", { name: winner }));
		void refresh();
	},
	onError: error => toast.error(getErrorMessage(error)),
});

const deleting = ref<Giveaway | null>(null);
const deleteOpen = ref(false);

const askDelete = (giveaway: Giveaway) => {
	deleting.value = giveaway;
	deleteOpen.value = true;
};

const remove = useMutation({
	mutationFn: (giveaway: Giveaway) => deleteGiveaway(props.guild.id, giveaway.id),
	onSuccess: () => {
		toast.success(t("giveaways.deleted"));
		deleteOpen.value = false;
		void refresh();
	},
	onError: error => toast.error(getErrorMessage(error)),
});

const itemName = (id: string | null) => giveaways.data.value?.items.find(item => item.id === id)?.name;
const roleName = (id: string | null) => giveaways.data.value?.roles.find(role => role.id === id)?.name;
const channelName = (id: string) => props.guild.channels.find(channel => channel.id === id)?.name ?? "?";
</script>

<template>
	<div class="space-y-4">
		<div class="flex flex-wrap items-center justify-between gap-2">
			<p class="text-muted-foreground">{{ $t("giveaways.intro") }}</p>
			<Button :disabled="!giveaways.data.value" @click="openCreate">
				<Plus />
				{{ $t("giveaways.add") }}
			</Button>
		</div>

		<ErrorState v-if="giveaways.isError.value" :error="giveaways.error.value" @retry="giveaways.refetch()" />
		<Skeleton v-else-if="giveaways.isPending.value" class="h-48" />
		<EmptyState
			v-else-if="!giveaways.data.value?.giveaways.length"
			:title="$t('giveaways.empty')"
			:description="$t('giveaways.emptyText')"
		/>

		<ul v-else class="hud-panel divide-y">
			<li
				v-for="giveaway in giveaways.data.value.giveaways"
				:key="giveaway.id"
				class="flex flex-wrap items-center gap-3 p-3"
			>
				<div class="min-w-0 flex-1 space-y-1">
					<p class="flex flex-wrap items-center gap-2">
						<span class="truncate font-medium">🎉 {{ giveaway.prize }}</span>
						<Badge :variant="giveaway.ended ? 'outline' : 'secondary'">
							{{ giveaway.ended ? $t("giveaways.ended") : $t("giveaways.active") }}
						</Badge>
					</p>
					<p class="text-xs text-muted-foreground">
						#{{ channelName(giveaway.channelId) }} ·
						{{
							giveaway.ended
								? $t("giveaways.endedAt", { time: formatRelative(giveaway.endsAt) })
								: $t("giveaways.endsAt", { time: formatRelative(giveaway.endsAt) })
						}}
						· {{ $t("giveaways.participants", giveaway.participants) }}
						<template v-if="giveaway.ended">
							· {{ $t("giveaways.winnersCount", giveaway.winnerIds.length) }}
						</template>
					</p>
					<p class="flex flex-wrap gap-1 text-xs">
						<Badge v-if="giveaway.credits" variant="outline">💰 {{ formatNumber(giveaway.credits) }}</Badge>
						<Badge v-if="giveaway.itemId" variant="outline"
							>🎁 {{ itemName(giveaway.itemId) ?? "?" }}</Badge
						>
						<Badge v-if="giveaway.requiredLevel" variant="outline">
							{{ $t("giveaways.levelBadge", { n: giveaway.requiredLevel }) }}
						</Badge>
						<Badge v-if="giveaway.requiredRoleId" variant="outline">
							@{{ roleName(giveaway.requiredRoleId) ?? "?" }}
						</Badge>
					</p>
				</div>

				<div class="flex gap-1">
					<Button v-if="giveaway.url" as-child variant="ghost" size="icon" :aria-label="$t('common.open')">
						<a :href="giveaway.url" target="_blank" rel="noopener"><ExternalLink /></a>
					</Button>
					<Button
						v-if="!giveaway.ended"
						variant="outline"
						size="sm"
						:disabled="end.isPending.value"
						@click="end.mutate(giveaway)"
					>
						<Flag />
						{{ $t("giveaways.end") }}
					</Button>
					<Button
						v-else
						variant="outline"
						size="sm"
						:disabled="reroll.isPending.value || giveaway.participants <= giveaway.winnerIds.length"
						@click="reroll.mutate(giveaway)"
					>
						<RefreshCw />
						{{ $t("giveaways.reroll") }}
					</Button>
					<Button variant="ghost" size="icon" :aria-label="$t('common.delete')" @click="askDelete(giveaway)">
						<Trash2 />
					</Button>
				</div>
			</li>
		</ul>
	</div>

	<Dialog v-model:open="formOpen">
		<DialogContent class="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
			<DialogHeader>
				<DialogTitle>{{ $t("giveaways.addTitle") }}</DialogTitle>
				<DialogDescription>{{ $t("giveaways.formHint") }}</DialogDescription>
			</DialogHeader>

			<form id="giveaway-form" class="grid gap-4 sm:grid-cols-2" @submit.prevent="create.mutate()">
				<div class="space-y-2 sm:col-span-2">
					<Label for="giveaway-prize">{{ $t("giveaways.prize") }}</Label>
					<Input id="giveaway-prize" v-model="form.prize" maxlength="200" required />
				</div>

				<div class="space-y-2 sm:col-span-2">
					<Label for="giveaway-channel">{{ $t("giveaways.channel") }}</Label>
					<ChannelSelect id="giveaway-channel" v-model="form.channelId" :channels="guild.channels" />
				</div>

				<div class="space-y-2">
					<Label for="giveaway-duration">{{ $t("giveaways.duration") }}</Label>
					<div class="flex gap-2">
						<Input id="giveaway-duration" v-model="form.duration" type="number" min="1" required />
						<Select v-model="form.unit">
							<SelectTrigger class="w-32 shrink-0">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem v-for="(_, unit) in UNITS" :key="unit" :value="unit">
									{{ $t(`giveaways.units.${unit}`) }}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
				<div class="space-y-2">
					<Label for="giveaway-winners">{{ $t("giveaways.winners") }}</Label>
					<Input id="giveaway-winners" v-model="form.winners" type="number" min="1" max="20" required />
				</div>

				<div class="space-y-2">
					<Label for="giveaway-credits">{{ $t("giveaways.credits") }}</Label>
					<Input id="giveaway-credits" v-model="form.credits" type="number" min="0" placeholder="0" />
				</div>
				<div class="space-y-2">
					<Label for="giveaway-item">{{ $t("giveaways.item") }}</Label>
					<Select id="giveaway-item" v-model="form.itemId">
						<SelectTrigger class="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem :value="NONE">{{ $t("giveaways.noItem") }}</SelectItem>
							<SelectItem v-for="item in giveaways.data.value?.items" :key="item.id" :value="item.id">
								{{ item.name }}
							</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div class="space-y-2">
					<Label for="giveaway-level">{{ $t("giveaways.requiredLevel") }}</Label>
					<Input id="giveaway-level" v-model="form.requiredLevel" type="number" min="0" placeholder="0" />
				</div>
				<div class="space-y-2">
					<Label for="giveaway-role">{{ $t("giveaways.requiredRole") }}</Label>
					<Select id="giveaway-role" v-model="form.requiredRoleId">
						<SelectTrigger class="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem :value="NONE">{{ $t("giveaways.anyone") }}</SelectItem>
							<SelectItem v-for="role in giveaways.data.value?.roles" :key="role.id" :value="role.id">
								<span class="size-2.5 shrink-0 rounded-full" :style="{ backgroundColor: role.color }" />
								<span class="truncate">{{ role.name }}</span>
							</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</form>

			<DialogFooter>
				<Button variant="outline" @click="formOpen = false">{{ $t("common.cancel") }}</Button>
				<Button type="submit" form="giveaway-form" :disabled="!form.channelId || create.isPending.value">
					<LoaderCircle v-if="create.isPending.value" class="animate-spin" />
					{{ $t("giveaways.start") }}
				</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>

	<ConfirmDialog
		v-model:open="deleteOpen"
		:title="$t('giveaways.deleteTitle', { name: deleting?.prize })"
		:description="$t('giveaways.deleteText')"
		:confirm-text="$t('common.delete')"
		:loading="remove.isPending.value"
		@confirm="deleting && remove.mutate(deleting)"
	/>
</template>
