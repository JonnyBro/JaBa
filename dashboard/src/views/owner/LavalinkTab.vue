<script setup lang="ts">
import { destroyPlayer, getLavalink } from "@/api";
import EmptyState from "@/components/common/EmptyState.vue";
import ErrorState from "@/components/common/ErrorState.vue";
import StatTile from "@/components/common/StatTile.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDuration } from "@/lib/format";
import { getErrorMessage } from "@/plugins/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { Pause, Square } from "lucide-vue-next";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";

const { t } = useI18n();
const queryClient = useQueryClient();
const lavalink = useQuery({ queryKey: ["owner", "lavalink"], queryFn: getLavalink, refetchInterval: 5_000 });

const megabytes = (bytes: number) => `${Math.round(bytes / 1024 / 1024)} MB`;
const percent = (load: number) => `${Math.round(load * 100)}%`;

const destroy = useMutation({
	mutationFn: (guildId: string) => destroyPlayer(guildId),
	onSuccess: async () => {
		toast.success(t("owner.lavalink.destroyed"));
		await queryClient.invalidateQueries({ queryKey: ["owner", "lavalink"] });
	},
	onError: error => toast.error(getErrorMessage(error)),
});
</script>

<template>
	<ErrorState v-if="lavalink.isError.value" :error="lavalink.error.value" @retry="lavalink.refetch()" />
	<Skeleton v-else-if="lavalink.isPending.value" class="h-48" />

	<div v-else-if="lavalink.data.value" class="space-y-6">
		<section v-for="node in lavalink.data.value.nodes" :key="node.id" class="space-y-3">
			<div class="flex items-center gap-2">
				<h3 class="section-title text-lg">{{ node.id }}</h3>
				<Badge :variant="node.connected ? 'secondary' : 'destructive'">
					{{ node.connected ? $t("owner.lavalink.connected") : $t("owner.lavalink.disconnected") }}
				</Badge>
				<span v-if="node.version" class="font-display text-sm text-muted-foreground">v{{ node.version }}</span>
			</div>
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<StatTile
					:label="$t('owner.lavalink.players')"
					:value="`${node.playingPlayers} / ${node.players}`"
					:hint="$t('owner.lavalink.playersHint')"
				/>
				<StatTile :label="$t('home.stats.uptime')" :value="formatDuration(node.uptime)" />
				<StatTile
					:label="$t('owner.lavalink.cpu')"
					:value="node.cpu ? percent(node.cpu.lavalink) : '—'"
					:hint="node.cpu ? $t('owner.lavalink.system', { value: percent(node.cpu.system) }) : undefined"
				/>
				<StatTile
					:label="$t('owner.lavalink.memory')"
					:value="node.memory ? megabytes(node.memory.used) : '—'"
					:hint="
						node.memory
							? $t('owner.lavalink.allocated', { value: megabytes(node.memory.allocated) })
							: undefined
					"
				/>
			</div>
		</section>

		<section class="space-y-3">
			<h3 class="section-title text-lg">{{ $t("owner.lavalink.activePlayers") }}</h3>
			<EmptyState v-if="!lavalink.data.value.players.length" :title="$t('owner.lavalink.noPlayers')" />
			<div v-else class="panel overflow-x-auto">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{{ $t("owner.lavalink.server") }}</TableHead>
							<TableHead>{{ $t("owner.lavalink.track") }}</TableHead>
							<TableHead class="text-right">{{ $t("owner.lavalink.listeners") }}</TableHead>
							<TableHead class="text-right">{{ $t("owner.lavalink.queue") }}</TableHead>
							<TableHead class="w-12" />
						</TableRow>
					</TableHeader>
					<TableBody>
						<TableRow v-for="player in lavalink.data.value.players" :key="player.guildId">
							<TableCell class="max-w-56">
								<p class="truncate">{{ player.guildName }}</p>
								<p v-if="player.voiceChannel" class="truncate text-sm text-muted-foreground">
									🔊 {{ player.voiceChannel }}
								</p>
							</TableCell>
							<TableCell class="max-w-72">
								<span class="flex items-center gap-1.5 truncate">
									<Pause v-if="player.paused" class="size-3.5 shrink-0 text-muted-foreground" />
									{{ player.current ?? "—" }}
								</span>
							</TableCell>
							<TableCell class="text-right font-display">{{ player.listeners }}</TableCell>
							<TableCell class="text-right font-display">{{ player.queue }}</TableCell>
							<TableCell>
								<Button
									variant="ghost"
									size="icon-sm"
									:disabled="destroy.isPending.value"
									:aria-label="$t('owner.lavalink.destroy')"
									@click="destroy.mutate(player.guildId)"
								>
									<Square />
								</Button>
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</div>
		</section>
	</div>
</template>
