<script setup lang="ts">
import { deleteGameServer, getGameServers } from "@/api";
import type { GameServer, GuildDetails } from "@/api/types";
import ConfirmDialog from "@/components/common/ConfirmDialog.vue";
import EmptyState from "@/components/common/EmptyState.vue";
import ErrorState from "@/components/common/ErrorState.vue";
import GameServerChart from "@/components/server/GameServerChart.vue";
import GameServerEditor from "@/components/server/GameServerEditor.vue";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/plugins/axios";
import { ExternalLink, Pencil, Plus, Trash2 } from "@lucide/vue";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";

const REFRESH_INTERVAL = 60_000;

const props = defineProps<{ guild: GuildDetails }>();

const { t } = useI18n();
const queryClient = useQueryClient();
const queryKey = ["guild", props.guild.id, "gameservers"];

const servers = useQuery({
	queryKey,
	queryFn: () => getGameServers(props.guild.id),
	refetchInterval: REFRESH_INTERVAL,
});

const editing = ref<GameServer | "new" | null>(null);
const canAdd = computed(() => !!servers.data.value && servers.data.value.servers.length < servers.data.value.max);

const channelName = (id: string) => props.guild.channels.find(c => c.id === id)?.name ?? id;

const displayName = (server: GameServer) => server.title || server.state?.name || `${server.host}:${server.port}`;

const onSaved = async () => {
	editing.value = null;
	await queryClient.invalidateQueries({ queryKey });
};

const deleteOpen = ref(false);
const deleting = ref<GameServer | null>(null);

const askDelete = (server: GameServer) => {
	deleting.value = server;
	deleteOpen.value = true;
};

const remove = useMutation({
	mutationFn: (server: GameServer) => deleteGameServer(props.guild.id, server.id),
	onSuccess: async () => {
		deleteOpen.value = false;
		toast.success(t("gameservers.removed"));
		await queryClient.invalidateQueries({ queryKey });
	},
	onError: error => toast.error(getErrorMessage(error)),
});
</script>

<template>
	<ErrorState v-if="servers.isError.value" :error="servers.error.value" @retry="servers.refetch()" />
	<Skeleton v-else-if="servers.isPending.value" class="h-64" />

	<div v-else-if="servers.data.value" class="space-y-6">
		<section class="hud-panel flex flex-wrap items-center justify-between gap-3 p-4">
			<div>
				<h2 class="hud-title text-lg">{{ $t("gameservers.pageTitle") }}</h2>
				<p class="text-sm text-muted-foreground">
					{{ $t("gameservers.hint", { max: servers.data.value.max }) }}
				</p>
			</div>
			<Button :disabled="!canAdd || editing !== null" @click="editing = 'new'">
				<Plus />
				{{ $t("gameservers.add") }}
			</Button>
		</section>

		<GameServerEditor
			v-if="editing"
			:key="editing === 'new' ? 'new' : editing.id"
			:guild="guild"
			:games="servers.data.value.games"
			:server="editing === 'new' ? null : editing"
			@saved="onSaved"
			@cancel="editing = null"
		/>

		<EmptyState
			v-if="!servers.data.value.servers.length && !editing"
			:title="$t('gameservers.emptyTitle')"
			:description="$t('gameservers.emptyText')"
		/>

		<div class="grid gap-3 md:grid-cols-2">
			<article
				v-for="server in servers.data.value.servers"
				:key="server.id"
				class="hud-panel flex flex-col gap-2 p-4"
			>
				<div class="flex items-start justify-between gap-2">
					<div class="min-w-0">
						<p class="flex items-center gap-2 font-medium">
							<span
								:class="
									cn('size-2.5 shrink-0 rounded-full', server.online ? 'bg-green-500' : 'bg-red-500')
								"
							/>
							<span class="truncate">{{ displayName(server) }}</span>
						</p>
						<p class="truncate text-sm text-muted-foreground">
							{{ server.gameName }} · {{ server.host }}:{{ server.port }}
						</p>
					</div>
					<div class="flex shrink-0 gap-1">
						<Button
							size="icon"
							variant="ghost"
							:disabled="editing !== null"
							:aria-label="$t('common.edit')"
							@click="editing = server"
						>
							<Pencil />
						</Button>
						<Button
							size="icon"
							variant="ghost"
							:aria-label="$t('common.delete')"
							@click="askDelete(server)"
						>
							<Trash2 />
						</Button>
					</div>
				</div>

				<p class="text-sm">
					<template v-if="server.online && server.state">
						{{
							$t("gameservers.playersNow", {
								count: server.state.numplayers,
								max: server.state.maxplayers,
							})
						}}
						<span v-if="server.state.map" class="text-muted-foreground">· {{ server.state.map }}</span>
					</template>
					<template v-else-if="server.lastOnline">
						{{ $t("gameservers.offlineSince", { date: formatRelative(server.lastOnline) }) }}
					</template>
					<template v-else>{{ $t("gameservers.neverOnline") }}</template>
				</p>

				<GameServerChart :guild-id="guild.id" :server-id="server.id" />

				<p class="flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
					<span>#{{ channelName(server.channelId) }}</span>
					<a
						v-if="server.messageUrl"
						:href="server.messageUrl"
						target="_blank"
						rel="noopener"
						class="inline-flex items-center gap-1 text-hl hover:underline"
					>
						{{ $t("gameservers.openMessage") }}
						<ExternalLink class="size-3.5" />
					</a>
				</p>
			</article>
		</div>
	</div>

	<ConfirmDialog
		v-model:open="deleteOpen"
		:title="$t('gameservers.deleteTitle', { name: deleting ? displayName(deleting) : '' })"
		:description="$t('gameservers.deleteText')"
		:confirm-text="$t('common.delete')"
		:loading="remove.isPending.value"
		@confirm="deleting && remove.mutate(deleting)"
	/>
</template>
