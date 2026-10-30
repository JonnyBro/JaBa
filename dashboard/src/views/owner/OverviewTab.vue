<script setup lang="ts">
import { getBotSettings, getStats, getTasks, runTask, updateBotSettings } from "@/api";
import type { BotSettings } from "@/api/types";
import ErrorState from "@/components/common/ErrorState.vue";
import Hint from "@/components/common/Hint.vue";
import StatTile from "@/components/common/StatTile.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCompact, formatDateTime, formatDuration, formatRelative } from "@/lib/format";
import { getErrorMessage } from "@/plugins/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { Check, CircleAlert, LoaderCircle, Play, Save } from "@lucide/vue";
import { computed, reactive, watch } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";

const { t } = useI18n();
const queryClient = useQueryClient();

const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: getStats, refetchInterval: 30_000 });
const settings = useQuery({ queryKey: ["owner", "settings"], queryFn: getBotSettings });
const tasks = useQuery({ queryKey: ["owner", "tasks"], queryFn: getTasks, refetchInterval: 5_000 });

const form = reactive({ maintenance: false, message: "", status: "" });

watch(
	() => settings.data.value,
	value => {
		if (!value) return;
		form.maintenance = value.maintenance.enabled;
		form.message = value.maintenance.message ?? "";
		form.status = value.status ?? "";
	},
	{ immediate: true },
);

const save = useMutation({
	mutationFn: (body: Partial<BotSettings>) => updateBotSettings(body),
	onSuccess: data => {
		queryClient.setQueryData(["owner", "settings"], data);
		toast.success(t("owner.saved"));
	},
	onError: error => toast.error(getErrorMessage(error)),
});

const saveMaintenance = () =>
	save.mutate({ maintenance: { enabled: form.maintenance, message: form.message.trim() || null } });
const saveStatus = () => save.mutate({ status: form.status.trim() || null });

const run = useMutation({
	mutationFn: (name: string) => runTask(name),
	onSuccess: async (_data, name) => {
		toast.success(t("owner.tasks.started", { name }));
		await queryClient.invalidateQueries({ queryKey: ["owner", "tasks"] });
	},
	onError: error => toast.error(getErrorMessage(error)),
});

const tiles = computed(() => [
	{ label: t("home.stats.servers"), value: formatCompact(stats.value?.guilds) },
	{ label: t("home.stats.users"), value: formatCompact(stats.value?.users) },
	{ label: t("home.stats.uptime"), value: formatDuration(stats.value?.uptime) },
	{ label: t("home.stats.ping"), value: stats.value ? `${stats.value.ping}ms` : "—" },
]);
</script>

<template>
	<div class="space-y-8">
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<StatTile v-for="tile in tiles" :key="tile.label" :label="tile.label" :value="tile.value" />
		</div>

		<div class="grid gap-4 lg:grid-cols-2">
			<form
				class="hud-panel space-y-3 p-4"
				:class="form.maintenance && 'hud-edge'"
				@submit.prevent="saveMaintenance"
			>
				<h3 class="hud-title text-lg">{{ $t("owner.maintenance.title") }}</h3>
				<p class="text-sm text-muted-foreground">{{ $t("owner.maintenance.hint") }}</p>
				<Label class="flex items-center gap-2 font-normal">
					<input v-model="form.maintenance" type="checkbox" class="accent-hl" />
					{{ $t("owner.maintenance.enabled") }}
				</Label>
				<Input v-model="form.message" maxlength="128" :placeholder="$t('owner.maintenance.message')" />
				<div class="flex justify-end">
					<Button type="submit" size="sm" :disabled="save.isPending.value">
						<Save />
						{{ $t("common.save") }}
					</Button>
				</div>
			</form>

			<form class="hud-panel space-y-3 p-4" @submit.prevent="saveStatus">
				<h3 class="hud-title text-lg">{{ $t("owner.status.title") }}</h3>
				<p class="text-sm text-muted-foreground">{{ $t("owner.status.hint") }}</p>
				<Input v-model="form.status" maxlength="128" :placeholder="$t('owner.status.placeholder')" />
				<div class="flex justify-end">
					<Button type="submit" size="sm" :disabled="save.isPending.value">
						<Save />
						{{ $t("common.save") }}
					</Button>
				</div>
			</form>
		</div>

		<ErrorState v-if="tasks.isError.value" :error="tasks.error.value" @retry="tasks.refetch()" />
		<template v-else-if="tasks.data.value">
			<section class="space-y-3">
				<h3 class="hud-title text-lg">{{ $t("owner.tasks.title") }}</h3>
				<div class="hud-panel overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>{{ $t("owner.tasks.name") }}</TableHead>
								<TableHead>{{ $t("owner.tasks.schedule") }}</TableHead>
								<TableHead>{{ $t("owner.tasks.lastRun") }}</TableHead>
								<TableHead>{{ $t("owner.tasks.nextRun") }}</TableHead>
								<TableHead class="w-12" />
							</TableRow>
						</TableHeader>
						<TableBody>
							<TableRow v-for="task in tasks.data.value.tasks" :key="task.name">
								<TableCell>
									<div class="flex items-center gap-2">
										<span class="font-hud">{{ task.name }}</span>
										<Badge v-if="task.isRunning" variant="secondary">
											<LoaderCircle class="animate-spin" /> {{ $t("owner.tasks.running") }}
										</Badge>
										<Hint v-else-if="task.lastError" :text="task.lastError">
											<Badge variant="destructive" class="cursor-help">
												<CircleAlert /> {{ $t("owner.tasks.failed") }}
											</Badge>
										</Hint>
									</div>
								</TableCell>
								<TableCell class="font-mono text-sm text-muted-foreground">{{
									task.schedule
								}}</TableCell>
								<TableCell class="text-muted-foreground">
									<template v-if="task.lastRun">
										{{ formatRelative(task.lastRun) }}
										<span class="text-xs">({{ task.lastDuration }} ms)</span>
									</template>
									<template v-else>—</template>
								</TableCell>
								<TableCell class="text-muted-foreground">
									<Hint :text="formatDateTime(task.nextRun)">
										<span class="cursor-help">{{ formatRelative(task.nextRun) }}</span>
									</Hint>
								</TableCell>
								<TableCell>
									<Button
										variant="ghost"
										size="icon-sm"
										:disabled="task.isRunning || run.isPending.value"
										:aria-label="$t('owner.tasks.run')"
										@click="run.mutate(task.name)"
									>
										<Play />
									</Button>
								</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</div>
			</section>

			<section class="space-y-3">
				<h3 class="hud-title text-lg">{{ $t("owner.migrations.title") }}</h3>
				<ul class="hud-panel divide-y">
					<li
						v-for="migration in tasks.data.value.migrations"
						:key="migration.id"
						class="flex items-center gap-3 px-3 py-2"
					>
						<Check v-if="migration.appliedAt" class="size-4 shrink-0 text-muted-foreground" />
						<CircleAlert v-else class="size-4 shrink-0 text-destructive-foreground" />
						<div class="min-w-0 flex-1">
							<p class="truncate font-hud">{{ migration.id }}</p>
							<p class="truncate text-sm text-muted-foreground">{{ migration.description }}</p>
						</div>
						<span class="shrink-0 text-sm text-muted-foreground">
							{{
								migration.appliedAt
									? formatDateTime(migration.appliedAt)
									: $t("owner.migrations.pending")
							}}
						</span>
					</li>
				</ul>
			</section>
		</template>
	</div>
</template>
