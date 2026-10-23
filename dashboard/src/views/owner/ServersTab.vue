<script setup lang="ts">
import { addBlacklist, getOwnerGuilds, leaveGuild } from "@/api";
import type { OwnerGuild } from "@/api/types";
import ConfirmDialog from "@/components/common/ConfirmDialog.vue";
import EmptyState from "@/components/common/EmptyState.vue";
import ErrorState from "@/components/common/ErrorState.vue";
import UserAvatar from "@/components/common/UserAvatar.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatNumber } from "@/lib/format";
import { getErrorMessage } from "@/plugins/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { Ban, LogOut, Music, Search } from "lucide-vue-next";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";

const { t } = useI18n();
const queryClient = useQueryClient();
const guilds = useQuery({ queryKey: ["owner", "guilds"], queryFn: getOwnerGuilds, refetchInterval: 30_000 });

const search = ref("");
const filtered = computed(() => {
	const q = search.value.trim().toLowerCase();
	return (guilds.data.value ?? []).filter(g => !q || g.id === q || g.name.toLowerCase().includes(q));
});

const target = ref<{ guild: OwnerGuild; action: "leave" | "blacklist" } | null>(null);
const confirmOpen = computed({
	get: () => Boolean(target.value),
	set: value => {
		if (!value) target.value = null;
	},
});

const act = useMutation({
	mutationFn: ({ guild, action }: NonNullable<typeof target.value>) =>
		action === "leave" ? leaveGuild(guild.id) : addBlacklist({ type: "guild", id: guild.id }),
	onSuccess: async (_data, { guild, action }) => {
		toast.success(t(`owner.servers.${action}Done`, { name: guild.name }));
		target.value = null;
		await queryClient.invalidateQueries({ queryKey: ["owner"] });
	},
	onError: error => toast.error(getErrorMessage(error)),
});
</script>

<template>
	<div class="space-y-4">
		<div class="relative max-w-sm">
			<Search class="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input v-model="search" :placeholder="$t('owner.servers.search')" class="pl-8" />
		</div>

		<ErrorState v-if="guilds.isError.value" :error="guilds.error.value" @retry="guilds.refetch()" />
		<div v-else-if="guilds.isPending.value" class="space-y-2">
			<Skeleton v-for="i in 8" :key="i" class="h-12 w-full" />
		</div>
		<EmptyState v-else-if="!filtered.length" :title="$t('owner.servers.empty')" />

		<div v-else class="panel overflow-x-auto">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>{{ $t("owner.servers.server", { n: filtered.length }) }}</TableHead>
						<TableHead class="text-right">{{ $t("owner.servers.members") }}</TableHead>
						<TableHead class="hidden text-right sm:table-cell">{{ $t("owner.servers.joined") }}</TableHead>
						<TableHead class="w-24" />
					</TableRow>
				</TableHeader>
				<TableBody>
					<TableRow v-for="guild in filtered" :key="guild.id">
						<TableCell class="max-w-72">
							<div class="flex items-center gap-2">
								<UserAvatar :name="guild.name" :src="guild.icon" class="size-8" />
								<div class="min-w-0">
									<p class="truncate">{{ guild.name }}</p>
									<p class="font-mono text-xs text-muted-foreground">{{ guild.id }}</p>
								</div>
								<Badge v-if="guild.playing" variant="secondary"><Music /></Badge>
							</div>
						</TableCell>
						<TableCell class="text-right font-display">{{ formatNumber(guild.memberCount) }}</TableCell>
						<TableCell class="hidden text-right text-muted-foreground sm:table-cell">
							{{ formatDate(guild.joinedAt) }}
						</TableCell>
						<TableCell>
							<div class="flex justify-end">
								<Button
									variant="ghost"
									size="icon-sm"
									:aria-label="$t('owner.servers.blacklist')"
									@click="target = { guild, action: 'blacklist' }"
								>
									<Ban />
								</Button>
								<Button
									variant="ghost"
									size="icon-sm"
									:aria-label="$t('owner.servers.leave')"
									@click="target = { guild, action: 'leave' }"
								>
									<LogOut />
								</Button>
							</div>
						</TableCell>
					</TableRow>
				</TableBody>
			</Table>
		</div>

		<ConfirmDialog
			v-model:open="confirmOpen"
			:title="target ? $t(`owner.servers.${target.action}Title`, { name: target.guild.name }) : ''"
			:description="target ? $t(`owner.servers.${target.action}Text`) : ''"
			:confirm-text="target ? $t(`owner.servers.${target.action}`) : ''"
			:loading="act.isPending.value"
			@confirm="target && act.mutate(target)"
		/>
	</div>
</template>
