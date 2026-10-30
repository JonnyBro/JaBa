<script setup lang="ts">
import { getGuilds } from "@/api";
import EmptyState from "@/components/common/EmptyState.vue";
import ErrorState from "@/components/common/ErrorState.vue";
import SectionTitle from "@/components/common/SectionTitle.vue";
import UserAvatar from "@/components/common/UserAvatar.vue";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/vue-query";
import { Music, Plus, Settings } from "@lucide/vue";

const guilds = useQuery({ queryKey: ["guilds"], queryFn: getGuilds });
</script>

<template>
	<section class="space-y-4">
		<SectionTitle :title="$t('servers.title')" :subtitle="$t('servers.subtitle')" />

		<ErrorState v-if="guilds.isError.value" :error="guilds.error.value" @retry="guilds.refetch()" />

		<div v-else-if="guilds.isPending.value" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			<Skeleton v-for="i in 6" :key="i" class="h-20" />
		</div>

		<EmptyState
			v-else-if="!guilds.data.value?.length"
			:title="$t('servers.empty')"
			:description="$t('servers.emptyText')"
		/>

		<div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			<div
				v-for="guild in guilds.data.value"
				:key="guild.id"
				class="hud-panel flex items-center gap-3 p-3"
				:class="guild.botPresent ? 'hud-edge' : 'opacity-70'"
			>
				<UserAvatar :name="guild.name" :src="guild.icon" class="size-12" />
				<span class="min-w-0 flex-1 truncate font-hud text-lg">{{ guild.name }}</span>

				<Button v-if="guild.botPresent && guild.manageable" as-child size="sm">
					<RouterLink :to="{ name: 'server', params: { id: guild.id } }">
						<Settings />
						{{ $t("servers.manage") }}
					</RouterLink>
				</Button>
				<Button v-else-if="guild.botPresent" as-child variant="outline" size="sm">
					<RouterLink :to="{ name: 'server-music', params: { id: guild.id } }">
						<Music />
						{{ $t("servers.music") }}
					</RouterLink>
				</Button>
				<Button
					v-else-if="guild.invite"
					as="a"
					:href="guild.invite"
					target="_blank"
					rel="noopener"
					variant="outline"
					size="sm"
				>
					<Plus />
					{{ $t("servers.invite") }}
				</Button>
			</div>
		</div>
	</section>
</template>
