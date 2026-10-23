<script setup lang="ts">
import { musicAction, musicClear, musicMove, musicPlay, musicRemove, musicSeek, musicVolume } from "@/api";
import type { GuildInfo, PlayerAction } from "@/api/types";
import EmptyState from "@/components/common/EmptyState.vue";
import Hint from "@/components/common/Hint.vue";
import UserAvatar from "@/components/common/UserAvatar.vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useMusic } from "@/composables/useMusic";
import { formatDuration, formatTrackTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/plugins/axios";
import { useMutation } from "@tanstack/vue-query";
import {
	ArrowDown,
	ArrowUp,
	Infinity as InfinityIcon,
	ListPlus,
	LoaderCircle,
	Pause,
	Play,
	Repeat,
	Repeat1,
	Shuffle,
	SkipBack,
	SkipForward,
	Square,
	Trash2,
	Volume2,
	WifiOff,
} from "lucide-vue-next";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";

// "auto" lets the bot pick, which is YouTube Music
const SOURCES = ["auto", "ytm", "yt", "sp", "ym", "sc"] as const;

const props = defineProps<{ guild: GuildInfo }>();

const { t } = useI18n();
const guildId = computed(() => props.guild.id);
const { state, connected, position } = useMusic(guildId);

const active = computed(() => (state.value?.active ? state.value : null));
const canControl = computed(() => Boolean(active.value?.canControl));
const canStart = computed(() => state.value?.active === false && state.value.canStart);
const canAdd = computed(() =>
	Boolean(state.value && (state.value.active ? state.value.canControl : state.value.canStart)),
);

const run = useMutation({
	mutationFn: (request: () => Promise<unknown>) => request(),
	onError: error => toast.error(getErrorMessage(error)),
});

const act = (action: PlayerAction) => run.mutate(() => musicAction(guildId.value, action));

// The slider sends the value once it is released, not on every step
const volume = ref(100);
watch(
	() => active.value?.volume,
	value => value !== undefined && (volume.value = value),
	{ immediate: true },
);
const commitVolume = () => run.mutate(() => musicVolume(guildId.value, volume.value));

const progress = computed(() => {
	const track = active.value?.current;
	if (!track || track.isStream || !track.duration) return 0;

	return Math.min(100, (position.value / track.duration) * 100);
});

const seek = (event: MouseEvent) => {
	const track = active.value?.current;
	if (!canControl.value || !track || track.isStream) return;

	const bar = event.currentTarget as HTMLElement;
	const ratio = (event.clientX - bar.getBoundingClientRect().left) / bar.offsetWidth;

	run.mutate(() => musicSeek(guildId.value, Math.round(track.duration * Math.min(Math.max(ratio, 0), 1))));
};

const query = ref("");
const source = ref<(typeof SOURCES)[number]>("auto");
const playNext = ref(false);

const add = useMutation({
	mutationFn: () =>
		musicPlay(guildId.value, {
			query: query.value,
			source: source.value === "auto" ? undefined : source.value,
			next: playNext.value,
		}),
	onSuccess: ({ added, title }) => {
		query.value = "";
		toast.success(added > 1 ? t("music.addedMany", { n: added, title }) : t("music.added", { title }));
	},
	onError: error => toast.error(getErrorMessage(error)),
});

const repeatLabel = computed(() => t(`music.repeat.${active.value?.repeatMode ?? "off"}`));
</script>

<template>
	<div class="space-y-6">
		<p
			v-if="state && !connected"
			class="flex items-center gap-2 border border-destructive/60 px-3 py-2 text-sm text-destructive-foreground"
		>
			<WifiOff class="size-4" />
			{{ $t("music.reconnecting") }}
		</p>

		<Skeleton v-if="!state" class="h-48" />

		<template v-else>
			<p v-if="active && !canControl" class="border border-dashed px-3 py-2 text-sm text-muted-foreground">
				{{
					active.voiceChannel
						? $t("music.joinToControl", { channel: active.voiceChannel.name })
						: $t("music.cantControl")
				}}
			</p>

			<section v-if="active" class="panel panel-accent grid gap-4 p-4 sm:grid-cols-[10rem_1fr]">
				<img
					v-if="active.current.artworkUrl"
					:src="active.current.artworkUrl"
					alt=""
					class="aspect-square w-full max-w-40 object-cover"
				/>
				<div
					v-else
					class="flex aspect-square max-w-40 items-center justify-center bg-muted font-display text-4xl"
				>
					♪
				</div>

				<div class="flex min-w-0 flex-col gap-3">
					<div class="min-w-0">
						<p class="font-display text-sm text-muted-foreground">
							{{ active.paused ? $t("music.paused") : $t("music.playing") }}
							<template v-if="active.voiceChannel"> · 🔊 {{ active.voiceChannel.name }}</template>
						</p>
						<a
							v-if="active.current.uri"
							:href="active.current.uri"
							target="_blank"
							rel="noopener"
							class="block truncate font-display text-2xl hover:text-hl"
						>
							{{ active.current.title }}
						</a>
						<p v-else class="truncate font-display text-2xl">{{ active.current.title }}</p>
						<p class="truncate text-muted-foreground">{{ active.current.author }}</p>
						<p
							v-if="active.current.requester"
							class="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"
						>
							<UserAvatar
								:name="active.current.requester.name"
								:src="active.current.requester.avatar"
								class="size-5"
							/>
							{{ $t("music.requestedBy", { name: active.current.requester.name }) }}
						</p>
					</div>

					<div class="space-y-1">
						<div
							:class="cn('progress-bar', canControl && !active.current.isStream && 'cursor-pointer')"
							@click="seek"
						>
							<span :style="{ width: `${progress}%` }" />
						</div>
						<div class="flex justify-between font-display text-sm text-muted-foreground">
							<span>{{ formatTrackTime(position) }}</span>
							<span>{{
								active.current.isStream ? "LIVE" : formatTrackTime(active.current.duration)
							}}</span>
						</div>
					</div>

					<div class="flex flex-wrap items-center gap-1">
						<Button
							variant="ghost"
							size="icon"
							:disabled="!canControl || !active.hasPrevious"
							:aria-label="$t('music.back')"
							@click="act('back')"
						>
							<SkipBack />
						</Button>
						<Button
							size="icon"
							:disabled="!canControl"
							:aria-label="$t('music.pause')"
							@click="act('pause')"
						>
							<Play v-if="active.paused" />
							<Pause v-else />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							:disabled="!canControl"
							:aria-label="$t('music.skip')"
							@click="act('skip')"
						>
							<SkipForward />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							:disabled="!canControl"
							:aria-label="$t('music.stop')"
							@click="act('stop')"
						>
							<Square />
						</Button>

						<span class="mx-1 h-6 border-l" />

						<Hint :text="repeatLabel">
							<Button
								variant="ghost"
								size="icon"
								:class="active.repeatMode !== 'off' && 'text-hl'"
								:disabled="!canControl"
								:aria-label="repeatLabel"
								@click="act('loop')"
							>
								<Repeat1 v-if="active.repeatMode === 'track'" />
								<Repeat v-else />
							</Button>
						</Hint>
						<Hint :text="$t('music.shuffle')">
							<Button variant="ghost" size="icon" :disabled="!canControl" @click="act('shuffle')">
								<Shuffle />
							</Button>
						</Hint>
						<Hint :text="$t('music.autoplay')">
							<Button
								variant="ghost"
								size="icon"
								:class="active.autoplay && 'text-hl'"
								:disabled="!canControl"
								@click="act('autoplay')"
							>
								<InfinityIcon />
							</Button>
						</Hint>

						<label class="ml-auto flex items-center gap-2 font-display text-sm">
							<Volume2 class="size-4 text-muted-foreground" />
							<input
								v-model.number="volume"
								type="range"
								min="0"
								:max="active.maxVolume"
								step="5"
								class="w-28 accent-[var(--hl)]"
								:disabled="!canControl"
								@change="commitVolume"
							/>
							<span class="w-8 text-right">{{ volume }}</span>
						</label>
					</div>
				</div>
			</section>

			<EmptyState
				v-else
				:title="$t('music.nothing')"
				:description="canStart ? $t('music.nothingText') : $t('music.joinToStart')"
			/>

			<form class="panel flex flex-col gap-2 p-3 sm:flex-row sm:items-center" @submit.prevent="add.mutate()">
				<Input
					v-model="query"
					maxlength="500"
					:placeholder="$t('music.addPlaceholder')"
					:disabled="!canAdd"
					class="sm:flex-1"
				/>
				<Select v-model="source" :disabled="!canAdd">
					<SelectTrigger class="w-full sm:w-40">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem v-for="s in SOURCES" :key="s" :value="s">{{ $t(`music.sources.${s}`) }}</SelectItem>
					</SelectContent>
				</Select>
				<Label class="flex items-center gap-2 font-normal">
					<input v-model="playNext" type="checkbox" class="accent-[var(--hl)]" :disabled="!canAdd" />
					{{ $t("music.next") }}
				</Label>
				<Button type="submit" :disabled="!canAdd || !query.trim() || add.isPending.value">
					<LoaderCircle v-if="add.isPending.value" class="animate-spin" />
					<ListPlus v-else />
					{{ $t("music.add") }}
				</Button>
			</form>

			<section v-if="active" class="space-y-3">
				<div class="flex items-end justify-between gap-2">
					<h2 class="section-title">{{ $t("music.queue") }}</h2>
					<div class="flex items-center gap-3">
						<span class="font-display text-sm text-muted-foreground">
							{{
								$t("music.queueInfo", {
									n: active.queueTotal,
									time: formatDuration(active.queueDuration),
								})
							}}
						</span>
						<Button
							v-if="active.queueTotal"
							variant="ghost"
							size="sm"
							:disabled="!canControl"
							@click="run.mutate(() => musicClear(guildId))"
						>
							<Trash2 />
							{{ $t("music.clear") }}
						</Button>
					</div>
				</div>

				<p v-if="!active.queue.length" class="text-muted-foreground">{{ $t("music.emptyQueue") }}</p>

				<ol v-else class="panel divide-y">
					<li
						v-for="(track, i) in active.queue"
						:key="`${i}-${track.uri}`"
						class="flex items-center gap-3 px-3 py-2"
					>
						<span class="w-6 text-right font-display text-sm text-muted-foreground">{{ i + 1 }}</span>
						<img
							v-if="track.artworkUrl"
							:src="track.artworkUrl"
							alt=""
							class="size-10 shrink-0 object-cover"
						/>
						<div class="min-w-0 flex-1">
							<p class="truncate">{{ track.title }}</p>
							<p class="truncate text-sm text-muted-foreground">
								{{ track.author }}
								<template v-if="track.requester"> · {{ track.requester.name }}</template>
							</p>
						</div>
						<span class="font-display text-sm text-muted-foreground">
							{{ track.isStream ? "LIVE" : formatTrackTime(track.duration) }}
						</span>
						<div v-if="canControl" class="flex">
							<Button
								variant="ghost"
								size="icon-sm"
								:disabled="i === 0"
								@click="run.mutate(() => musicMove(guildId, i, i - 1))"
							>
								<ArrowUp />
							</Button>
							<Button
								variant="ghost"
								size="icon-sm"
								:disabled="i === active.queue.length - 1"
								@click="run.mutate(() => musicMove(guildId, i, i + 1))"
							>
								<ArrowDown />
							</Button>
							<Button variant="ghost" size="icon-sm" @click="run.mutate(() => musicRemove(guildId, i))">
								<Trash2 />
							</Button>
						</div>
					</li>
				</ol>
				<p v-if="active.queueTotal > active.queue.length" class="text-sm text-muted-foreground">
					{{ $t("music.more", { n: active.queueTotal - active.queue.length }) }}
				</p>
			</section>
		</template>
	</div>
</template>
