<script setup lang="ts">
import {
	addPlaylistTracks,
	createPlaylist,
	deletePlaylist,
	getPlaylist,
	getPlaylists,
	movePlaylistTrack,
	removePlaylistTrack,
	renamePlaylist,
	uploadPlaylistFile,
} from "@/api";
import type { Playlist } from "@/api/types";
import ConfirmDialog from "@/components/common/ConfirmDialog.vue";
import EmptyState from "@/components/common/EmptyState.vue";
import ErrorState from "@/components/common/ErrorState.vue";
import SectionTitle from "@/components/common/SectionTitle.vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDuration, formatRelative, formatTrackTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/plugins/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { useEventListener } from "@vueuse/core";
import {
	ArrowDown,
	ArrowUp,
	FileWarning,
	ListMusic,
	ListPlus,
	LoaderCircle,
	Plus,
	Save,
	Trash2,
	Upload,
} from "@lucide/vue";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { toast } from "vue-sonner";

const SOURCES = ["auto", "ytm", "yt", "sp", "ym", "sc"] as const;
const MAX_NAME = 50;

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const queryClient = useQueryClient();
const onError = (error: unknown) => toast.error(getErrorMessage(error));

const list = useQuery({ queryKey: ["playlists"], queryFn: getPlaylists });
const refreshList = () => queryClient.invalidateQueries({ queryKey: ["playlists"] });

const selectedId = computed(() => {
	const id = route.query.id;
	const items = list.data.value?.items ?? [];

	return (typeof id === "string" && items.some(p => p.id === id) ? id : items[0]?.id) ?? null;
});
const select = (id: string) => router.replace({ query: { id } });

const playlist = useQuery({
	queryKey: computed(() => ["playlist", selectedId.value]),
	queryFn: () => getPlaylist(selectedId.value),
	enabled: computed(() => !!selectedId.value),
});

const setPlaylist = async (data: Playlist) => {
	queryClient.setQueryData(["playlist", data.id], data);
	await refreshList();
};

const isFull = computed(() => !!list.data.value && list.data.value.items.length >= list.data.value.max);

const newName = ref("");
const create = useMutation({
	mutationFn: () => createPlaylist(newName.value),
	onSuccess: async data => {
		newName.value = "";
		await setPlaylist(data);
		await select(data.id);
	},
	onError,
});

const name = ref("");
watch(
	() => playlist.data.value,
	data => data && (name.value = data.name),
	{ immediate: true },
);

const rename = useMutation({
	mutationFn: () => renamePlaylist(selectedId.value, name.value),
	onSuccess: async data => {
		toast.success(t("playlists.saved"));
		await setPlaylist(data);
	},
	onError,
});

const confirmDelete = ref(false);
const remove = useMutation({
	mutationFn: () => deletePlaylist(selectedId.value),
	onSuccess: async () => {
		confirmDelete.value = false;
		await router.replace({ query: {} });
		await refreshList();
	},
	onError,
});

const query = ref("");
const source = ref<(typeof SOURCES)[number]>("auto");
const addTracks = useMutation({
	mutationFn: () =>
		addPlaylistTracks(selectedId.value, {
			query: query.value,
			source: source.value === "auto" ? undefined : source.value,
		}),
	onSuccess: async ({ added, skipped, title, playlist }) => {
		query.value = "";
		toast.success(added > 1 ? t("music.addedMany", { n: added, title }) : t("music.added", { title }));
		if (skipped) toast.warning(t("playlists.skipped", { n: skipped }));
		await setPlaylist(playlist);
	},
	onError,
});

const formatMegabytes = (bytes: number) => (bytes / 1024 / 1024).toFixed(1);
const storagePercent = computed(() => {
	const storage = list.data.value?.storage;
	return storage ? Math.min(100, (storage.used / storage.max) * 100) : 0;
});
const accept = computed(() => list.data.value?.extensions.map(ext => `.${ext}`).join(",") ?? "audio/*");

const fileInput = ref<HTMLInputElement>();
const uploadIndex = ref<number>();
const uploadProgress = ref(0);

const pickFile = (index?: number) => {
	uploadIndex.value = index;
	fileInput.value?.click();
};

const upload = useMutation({
	mutationFn: ({ file, index }: { file: File; index?: number }) => {
		uploadProgress.value = 0;
		return uploadPlaylistFile(selectedId.value, file, index, p => (uploadProgress.value = p));
	},
	onSuccess: async ({ title, playlist }) => {
		toast.success(t("music.added", { title }));
		await setPlaylist(playlist);
	},
	onError,
});

const filesLeft = ref(0);

const uploadFiles = async (files: File[], index?: number) => {
	const extensions = list.data.value?.extensions ?? [];
	const supported = files.filter(f => extensions.includes(f.name.split(".").pop()?.toLowerCase() ?? ""));
	const rejected = files.filter(f => !supported.includes(f));

	if (rejected.length)
		toast.warning(
			t("playlists.unsupported", { files: rejected.map(f => f.name).join(", "), formats: extensions.join(", ") }),
		);

	filesLeft.value = supported.length;

	for (const file of supported) {
		try {
			await upload.mutateAsync({ file, index });
		} catch {
			// The toast is already shown, and the next files would most likely hit the same limit
			break;
		} finally {
			filesLeft.value--;
		}
	}

	filesLeft.value = 0;
};

const onFileChosen = async (event: Event) => {
	const input = event.target as HTMLInputElement;
	const files = [...(input.files ?? [])];
	input.value = "";

	await uploadFiles(files, uploadIndex.value);
};

const dragDepth = ref(0);
const canDrop = computed(() => !!playlist.data.value && !upload.isPending.value);
const hasFiles = (event: DragEvent) => !!event.dataTransfer?.types.includes("Files");

const CURSOR_GAP = 20;
const dragPoint = ref({ x: 0, y: 0 });
const dropHint = ref<HTMLElement>();
const dropHintStyle = computed(() => {
	const { x, y } = dragPoint.value;
	const width = dropHint.value?.offsetWidth ?? 0;
	const height = dropHint.value?.offsetHeight ?? 0;

	const left = x + CURSOR_GAP + width > window.innerWidth ? x - CURSOR_GAP - width : x + CURSOR_GAP;
	const top = y + CURSOR_GAP + height > window.innerHeight ? y - CURSOR_GAP - height : y + CURSOR_GAP;

	return { transform: `translate(${Math.max(8, left)}px, ${Math.max(8, top)}px)` };
});

useEventListener(window, "dragenter", event => {
	if (!hasFiles(event)) return;
	event.preventDefault();
	dragDepth.value++;
});

useEventListener(window, "dragleave", event => {
	if (hasFiles(event)) dragDepth.value = Math.max(0, dragDepth.value - 1);
});

useEventListener(window, "dragover", event => {
	if (!hasFiles(event)) return;
	event.preventDefault();
	event.dataTransfer!.dropEffect = canDrop.value ? "copy" : "none";
	dragPoint.value = { x: event.clientX, y: event.clientY };
});

useEventListener(window, "drop", event => {
	if (!hasFiles(event)) return;
	event.preventDefault();
	dragDepth.value = 0;

	if (canDrop.value) void uploadFiles([...(event.dataTransfer?.files ?? [])]);
});

const edit = useMutation({
	mutationFn: (request: () => Promise<Playlist>) => request(),
	onSuccess: setPlaylist,
	onError,
});
</script>

<template>
	<div class="space-y-6">
		<SectionTitle :title="$t('playlists.title')" :subtitle="$t('playlists.subtitle')" />

		<ErrorState v-if="list.isError.value" :error="list.error.value" @retry="list.refetch()" />
		<Skeleton v-else-if="!list.data.value" class="h-64" />

		<div v-else class="grid gap-4 lg:grid-cols-[18rem_1fr]">
			<aside class="space-y-3">
				<form class="flex gap-2" @submit.prevent="create.mutate()">
					<Input
						v-model="newName"
						:maxlength="MAX_NAME"
						:placeholder="$t('playlists.newPlaceholder')"
						:disabled="isFull"
					/>
					<Button
						type="submit"
						size="icon"
						:aria-label="$t('playlists.create')"
						:disabled="isFull || !newName.trim() || create.isPending.value"
					>
						<LoaderCircle v-if="create.isPending.value" class="animate-spin" />
						<Plus v-else />
					</Button>
				</form>
				<p class="font-hud text-sm text-muted-foreground">
					{{ $t("playlists.count", { n: list.data.value.items.length, max: list.data.value.max }) }}
				</p>
				<div class="space-y-1">
					<div class="hud-bar">
						<span :style="{ width: `${storagePercent}%` }" />
					</div>
					<p class="font-hud text-sm text-muted-foreground">
						{{
							$t("playlists.storage", {
								used: formatMegabytes(list.data.value.storage.used),
								max: formatMegabytes(list.data.value.storage.max),
							})
						}}
					</p>
				</div>

				<ul v-if="list.data.value.items.length" class="hud-panel divide-y">
					<li v-for="item in list.data.value.items" :key="item.id">
						<button
							:class="
								cn(
									'flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-muted',
									item.id === selectedId && 'bg-muted text-hl',
								)
							"
							@click="select(item.id)"
						>
							<img
								v-if="item.artworkUrl"
								:src="item.artworkUrl"
								alt=""
								class="size-10 shrink-0 object-cover"
							/>
							<span v-else class="flex size-10 shrink-0 items-center justify-center bg-background">
								<ListMusic class="size-5 text-muted-foreground" />
							</span>
							<span class="min-w-0">
								<span class="block truncate font-hud">{{ item.name }}</span>
								<span class="block text-sm text-muted-foreground">
									{{ $t("playlists.tracks", { n: item.trackCount }) }}
								</span>
							</span>
						</button>
					</li>
				</ul>
			</aside>

			<EmptyState
				v-if="!list.data.value.items.length"
				:title="$t('playlists.empty')"
				:description="$t('playlists.emptyText')"
			/>
			<Skeleton v-else-if="!playlist.data.value" class="h-64" />

			<section v-else class="min-w-0 space-y-4">
				<div class="hud-panel hud-edge space-y-3 p-4">
					<form class="flex gap-2" @submit.prevent="rename.mutate()">
						<Input v-model="name" :maxlength="MAX_NAME" class="font-hud text-lg" />
						<Button
							type="submit"
							variant="outline"
							:disabled="
								!name.trim() || name.trim() === playlist.data.value.name || rename.isPending.value
							"
						>
							<Save />
							{{ $t("common.save") }}
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							:aria-label="$t('common.delete')"
							@click="confirmDelete = true"
						>
							<Trash2 />
						</Button>
					</form>
					<p class="font-hud text-sm text-muted-foreground">
						{{
							$t("music.queueInfo", {
								n: playlist.data.value.trackCount,
								time: formatDuration(playlist.data.value.duration),
							})
						}}
					</p>
					<p class="text-sm text-muted-foreground">
						{{ $t("playlists.howToPlay", { command: "/playlist" }) }}
					</p>
				</div>

				<form
					class="hud-panel flex flex-col gap-2 p-3 sm:flex-row sm:items-center"
					@submit.prevent="addTracks.mutate()"
				>
					<Input
						v-model="query"
						maxlength="500"
						:placeholder="$t('music.addPlaceholder')"
						:disabled="playlist.data.value.trackCount >= list.data.value.maxTracks"
						class="sm:flex-1"
					/>
					<Select v-model="source">
						<SelectTrigger class="w-full sm:w-40">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem v-for="s in SOURCES" :key="s" :value="s">
								{{ $t(`music.sources.${s}`) }}
							</SelectItem>
						</SelectContent>
					</Select>
					<Button
						type="submit"
						:disabled="
							!query.trim() ||
							addTracks.isPending.value ||
							playlist.data.value.trackCount >= list.data.value.maxTracks
						"
					>
						<LoaderCircle v-if="addTracks.isPending.value" class="animate-spin" />
						<ListPlus v-else />
						{{ $t("music.add") }}
					</Button>
					<Button
						type="button"
						variant="outline"
						:disabled="
							upload.isPending.value ||
							(playlist.data.value.trackCount >= list.data.value.maxTracks && uploadIndex === undefined)
						"
						@click="pickFile()"
					>
						<LoaderCircle v-if="upload.isPending.value" class="animate-spin" />
						<Upload v-else />
						<template v-if="upload.isPending.value">
							{{ uploadProgress }}%
							<template v-if="filesLeft > 1"
								>· {{ $t("playlists.filesLeft", { n: filesLeft }) }}</template
							>
						</template>
						<template v-else>{{ $t("playlists.upload") }}</template>
					</Button>
					<input
						ref="fileInput"
						type="file"
						:accept="accept"
						:multiple="uploadIndex === undefined"
						class="hidden"
						@change="onFileChosen"
					/>
				</form>
				<p class="text-sm text-muted-foreground">
					{{
						$t("playlists.uploadHint", {
							max: formatMegabytes(list.data.value.storage.max),
							formats: list.data.value.extensions.join(", "),
						})
					}}
				</p>

				<p v-if="!playlist.data.value.tracks.length" class="text-muted-foreground">
					{{ $t("playlists.noTracks") }}
				</p>
				<ol v-else class="hud-panel divide-y">
					<li
						v-for="(track, i) in playlist.data.value.tracks"
						:key="`${i}-${track.uri}-${track.title}`"
						:class="cn('flex items-center gap-3 px-3 py-2', track.file?.expired && 'bg-destructive/10')"
					>
						<span class="w-6 text-right font-hud text-sm text-muted-foreground">{{ i + 1 }}</span>
						<img
							v-if="track.artworkUrl"
							:src="track.artworkUrl"
							alt=""
							class="size-10 shrink-0 object-cover"
						/>
						<div class="min-w-0 flex-1">
							<a
								v-if="track.uri"
								:href="track.uri"
								target="_blank"
								rel="noopener"
								class="block truncate hover:text-hl"
							>
								{{ track.title }}
							</a>
							<p v-else class="truncate">{{ track.title }}</p>
							<p class="truncate text-sm text-muted-foreground">
								{{ track.author }}
								<template v-if="track.source"> · {{ track.source }}</template>
							</p>
							<p
								v-if="track.file?.expired"
								class="flex items-center gap-1 text-sm text-destructive-foreground"
							>
								<FileWarning class="size-4 shrink-0" />
								{{ $t("playlists.fileExpired") }}
							</p>
							<p
								v-else-if="track.file?.expiresAt"
								class="truncate text-xs text-muted-foreground"
								:title="$t('playlists.fileExpiresHint')"
							>
								{{
									$t("playlists.fileExpires", {
										time: formatRelative(Date.parse(track.file.expiresAt)),
									})
								}}
							</p>
						</div>
						<Button
							v-if="track.file?.expired"
							variant="outline"
							size="sm"
							:disabled="upload.isPending.value"
							@click="pickFile(i)"
						>
							<Upload />
							{{ $t("playlists.reupload") }}
						</Button>
						<span class="font-hud text-sm text-muted-foreground">
							{{ track.isStream ? "LIVE" : formatTrackTime(track.duration) }}
						</span>
						<div class="flex">
							<Button
								variant="ghost"
								size="icon-sm"
								:disabled="i === 0 || edit.isPending.value"
								@click="edit.mutate(() => movePlaylistTrack(selectedId!, i, i - 1))"
							>
								<ArrowUp />
							</Button>
							<Button
								variant="ghost"
								size="icon-sm"
								:disabled="i === playlist.data.value.tracks.length - 1 || edit.isPending.value"
								@click="edit.mutate(() => movePlaylistTrack(selectedId!, i, i + 1))"
							>
								<ArrowDown />
							</Button>
							<Button
								variant="ghost"
								size="icon-sm"
								:aria-label="$t('common.delete')"
								:disabled="edit.isPending.value"
								@click="edit.mutate(() => removePlaylistTrack(selectedId!, i))"
							>
								<Trash2 />
							</Button>
						</div>
					</li>
				</ol>
			</section>
		</div>

		<ConfirmDialog
			v-model:open="confirmDelete"
			:title="$t('playlists.deleteTitle', { name: playlist.data.value?.name })"
			:description="$t('playlists.deleteText')"
			:confirm-text="$t('common.delete')"
			:loading="remove.isPending.value"
			@confirm="remove.mutate()"
		/>

		<div v-if="dragDepth > 0" class="pointer-events-none fixed inset-0 z-50 bg-background/30">
			<div
				ref="dropHint"
				:style="dropHintStyle"
				:class="
					cn(
						'hud-panel absolute top-0 left-0 flex max-w-72 items-center gap-3 border-2 border-dashed p-3 shadow-lg',
						canDrop ? 'border-hl' : 'border-muted-foreground',
					)
				"
			>
				<Upload :class="cn('size-6 shrink-0', canDrop ? 'text-hl' : 'text-muted-foreground')" />
				<div class="min-w-0">
					<p class="font-hud">
						{{
							canDrop
								? $t("playlists.dropTo", { name: playlist.data.value?.name })
								: upload.isPending.value
									? $t("playlists.dropBusy")
									: $t("playlists.dropNoPlaylist")
						}}
					</p>
					<p v-if="canDrop && list.data.value" class="text-xs text-muted-foreground">
						{{ list.data.value.extensions.join(", ") }}
					</p>
				</div>
			</div>
		</div>
	</div>
</template>
