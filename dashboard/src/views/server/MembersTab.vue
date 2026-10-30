<script setup lang="ts">
import { getMembers, resetEconomy } from "@/api";
import type { GuildDetails, MemberSort } from "@/api/types";
import ConfirmDialog from "@/components/common/ConfirmDialog.vue";
import EmptyState from "@/components/common/EmptyState.vue";
import ErrorState from "@/components/common/ErrorState.vue";
import PaginationBar from "@/components/common/PaginationBar.vue";
import UserAvatar from "@/components/common/UserAvatar.vue";
import MemberSheet from "@/components/server/MemberSheet.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCompact, formatDate } from "@/lib/format";
import { getErrorMessage } from "@/plugins/axios";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { refDebounced } from "@vueuse/core";
import { Bot, Clock, RotateCcw, Search } from "@lucide/vue";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";

const PER_PAGE = 25;
const SORTS: MemberSort[] = ["name", "money", "bank", "level", "joined"];

const props = defineProps<{ guild: GuildDetails }>();

const { t } = useI18n();
const queryClient = useQueryClient();

const search = ref("");
const q = refDebounced(search, 300);
const sort = ref<MemberSort>("name");
const page = ref(1);
watch([q, sort], () => (page.value = 1));

const params = computed(() => ({
	q: q.value.trim() || undefined,
	sort: sort.value,
	page: page.value,
	limit: PER_PAGE,
}));
const members = useQuery({
	queryKey: ["guild", props.guild.id, "members", params],
	queryFn: () => getMembers(props.guild.id, params.value),
	placeholderData: keepPreviousData,
});

const selected = ref<string | null>(null);

const resetOpen = ref(false);
const reset = useMutation({
	mutationFn: () => resetEconomy(props.guild.id),
	onSuccess: async ({ members: count }) => {
		toast.success(t("members.economyReset", { n: count }));
		resetOpen.value = false;
		await queryClient.invalidateQueries({ queryKey: ["guild", props.guild.id, "members"] });
	},
	onError: error => toast.error(getErrorMessage(error)),
});
</script>

<template>
	<div class="space-y-4">
		<div class="flex flex-col gap-2 sm:flex-row sm:items-center">
			<div class="relative sm:w-72">
				<Search class="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input v-model="search" :placeholder="$t('members.search')" class="pl-8" />
			</div>
			<Select v-model="sort">
				<SelectTrigger class="w-full sm:w-44">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem v-for="s in SORTS" :key="s" :value="s">{{ $t(`members.sort.${s}`) }}</SelectItem>
				</SelectContent>
			</Select>
			<Button variant="outline" class="sm:ml-auto" @click="resetOpen = true">
				<RotateCcw />
				{{ $t("members.resetEconomy") }}
			</Button>
		</div>

		<ErrorState v-if="members.isError.value" :error="members.error.value" @retry="members.refetch()" />
		<div v-else-if="members.isPending.value" class="space-y-2">
			<Skeleton v-for="i in 8" :key="i" class="h-10 w-full" />
		</div>
		<EmptyState v-else-if="!members.data.value?.items.length" :title="$t('members.empty')" />
		<template v-else>
			<div class="hud-panel overflow-x-auto" :class="members.isPlaceholderData.value && 'opacity-60'">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{{ $t("members.member") }}</TableHead>
							<TableHead class="text-right">{{ $t("members.money") }}</TableHead>
							<TableHead class="text-right">{{ $t("members.bank") }}</TableHead>
							<TableHead class="text-right">{{ $t("members.level") }}</TableHead>
							<TableHead class="hidden text-right sm:table-cell">{{ $t("members.joined") }}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						<TableRow
							v-for="member in members.data.value.items"
							:key="member.id"
							class="cursor-pointer"
							@click="selected = member.id"
						>
							<TableCell class="max-w-64">
								<div class="flex items-center gap-2">
									<UserAvatar :name="member.displayName" :src="member.avatar" class="size-7" />
									<div class="min-w-0">
										<p class="truncate">{{ member.displayName }}</p>
										<p class="truncate text-sm text-muted-foreground">{{ member.username }}</p>
									</div>
									<Badge v-if="member.bot" variant="secondary"><Bot /> {{ $t("members.bot") }}</Badge>
									<Badge v-if="member.timeoutUntil" variant="destructive">
										<Clock /> {{ $t("members.timedOut") }}
									</Badge>
								</div>
							</TableCell>
							<TableCell class="text-right font-hud text-base">{{
								member.economy ? formatCompact(member.economy.money) : "—"
							}}</TableCell>
							<TableCell class="text-right font-hud text-base">{{
								member.economy ? formatCompact(member.economy.bank) : "—"
							}}</TableCell>
							<TableCell class="text-right font-hud text-base">{{
								member.economy?.level ?? "—"
							}}</TableCell>
							<TableCell class="hidden text-right text-muted-foreground sm:table-cell">
								{{ formatDate(member.joinedAt) }}
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</div>
			<PaginationBar v-model="page" :total="members.data.value.total" :per-page="PER_PAGE" />
		</template>

		<MemberSheet v-model:user-id="selected" :guild-id="guild.id" />

		<ConfirmDialog
			v-model:open="resetOpen"
			:title="$t('members.resetEconomyTitle')"
			:description="$t('members.resetEconomyText', { name: guild.name })"
			:confirm-text="$t('members.resetEconomy')"
			:loading="reset.isPending.value"
			@confirm="reset.mutate()"
		/>
	</div>
</template>
