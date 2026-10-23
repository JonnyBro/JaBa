<script setup lang="ts">
import { addBlacklist, getBlacklist, removeBlacklist } from "@/api";
import type { BlacklistEntry } from "@/api/types";
import EmptyState from "@/components/common/EmptyState.vue";
import ErrorState from "@/components/common/ErrorState.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import { getErrorMessage } from "@/plugins/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { Ban, Trash2 } from "lucide-vue-next";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";

const { t } = useI18n();
const queryClient = useQueryClient();
const blacklist = useQuery({ queryKey: ["owner", "blacklist"], queryFn: getBlacklist });

const type = ref<BlacklistEntry["type"]>("user");
const id = ref("");
const reason = ref("");

const refresh = () => queryClient.invalidateQueries({ queryKey: ["owner"] });

const add = useMutation({
	mutationFn: () => addBlacklist({ type: type.value, id: id.value.trim(), reason: reason.value.trim() || undefined }),
	onSuccess: async () => {
		toast.success(t("owner.blacklist.added"));
		id.value = "";
		reason.value = "";
		await refresh();
	},
	onError: error => toast.error(getErrorMessage(error)),
});

const remove = useMutation({
	mutationFn: (entry: BlacklistEntry) => removeBlacklist(entry),
	onSuccess: refresh,
	onError: error => toast.error(getErrorMessage(error)),
});
</script>

<template>
	<div class="space-y-4">
		<form class="hud-panel grid gap-2 p-3 sm:grid-cols-[9rem_14rem_1fr_auto]" @submit.prevent="add.mutate()">
			<Select v-model="type">
				<SelectTrigger class="w-full">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="user">{{ $t("owner.blacklist.user") }}</SelectItem>
					<SelectItem value="guild">{{ $t("owner.blacklist.guild") }}</SelectItem>
				</SelectContent>
			</Select>
			<Input v-model="id" inputmode="numeric" placeholder="ID" />
			<Input v-model="reason" maxlength="500" :placeholder="$t('owner.blacklist.reason')" />
			<Button type="submit" variant="destructive" :disabled="!id.trim() || add.isPending.value">
				<Ban />
				{{ $t("owner.blacklist.add") }}
			</Button>
		</form>
		<p class="text-sm text-muted-foreground">{{ $t("owner.blacklist.hint") }}</p>

		<ErrorState v-if="blacklist.isError.value" :error="blacklist.error.value" @retry="blacklist.refetch()" />
		<Skeleton v-else-if="blacklist.isPending.value" class="h-32" />
		<EmptyState v-else-if="!blacklist.data.value?.length" :title="$t('owner.blacklist.empty')" />

		<ul v-else class="hud-panel divide-y">
			<li
				v-for="entry in blacklist.data.value"
				:key="`${entry.type}-${entry.id}`"
				class="flex items-center gap-3 px-3 py-2"
			>
				<Badge variant="outline">{{ $t(`owner.blacklist.${entry.type}`) }}</Badge>
				<div class="min-w-0 flex-1">
					<p class="truncate">
						{{ entry.name ?? entry.id }}
						<span v-if="entry.name" class="font-mono text-xs text-muted-foreground">{{ entry.id }}</span>
					</p>
					<p v-if="entry.reason" class="truncate text-sm text-muted-foreground">{{ entry.reason }}</p>
				</div>
				<span class="text-sm text-muted-foreground">{{ formatDate(entry.createdAt) }}</span>
				<Button
					variant="ghost"
					size="icon-sm"
					:disabled="remove.isPending.value"
					:aria-label="$t('common.delete')"
					@click="remove.mutate(entry)"
				>
					<Trash2 />
				</Button>
			</li>
		</ul>
	</div>
</template>
