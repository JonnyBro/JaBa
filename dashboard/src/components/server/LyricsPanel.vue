<script setup lang="ts">
import { getMusicLyrics } from "@/api";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/plugins/axios";
import { useQuery } from "@tanstack/vue-query";
import { computed, nextTick, ref, watch } from "vue";

// Highlights a line a bit early, the position is only counted every half a second
const LEAD = 300;
// After a manual scroll the view stays where the user left it for a while
const FOLLOW_PAUSE = 5000;

const props = defineProps<{ guildId: string; trackKey: string; position: number; canSeek: boolean }>();
const emit = defineEmits<{ seek: [position: number] }>();

const lyrics = useQuery({
	queryKey: computed(() => ["lyrics", props.guildId, props.trackKey]),
	queryFn: () => getMusicLyrics(props.guildId),
	staleTime: Infinity,
	retry: false,
});

const lines = computed(() => (lyrics.data.value?.synced ? lyrics.data.value.lines : []));

const activeIndex = computed(() => {
	let index = -1;
	for (const [i, line] of lines.value.entries()) {
		if (line.time > props.position + LEAD) break;
		index = i;
	}

	return index;
});

const container = ref<HTMLElement>();
const lineElements: HTMLElement[] = [];
let pausedUntil = 0;

const pauseFollow = () => (pausedUntil = Date.now() + FOLLOW_PAUSE);

watch(activeIndex, async index => {
	if (index < 0 || Date.now() < pausedUntil) return;

	await nextTick();
	const box = container.value;
	const line = lineElements[index];
	if (!box || !line) return;

	// scrollIntoView would scroll the whole page too, only the lyrics box should move
	box.scrollTo({ top: line.offsetTop - box.clientHeight / 2 + line.offsetHeight / 2, behavior: "smooth" });
});

watch(
	() => props.trackKey,
	() => {
		pausedUntil = 0;
		container.value?.scrollTo({ top: 0 });
	},
);
</script>

<template>
	<section class="hud-panel space-y-3 p-4">
		<div class="flex items-baseline justify-between gap-2">
			<h2 class="hud-title text-lg">{{ $t("music.lyrics.title") }}</h2>
			<span v-if="lyrics.data.value" class="font-hud text-xs text-muted-foreground">
				{{ lyrics.data.value.source }}
			</span>
		</div>

		<Skeleton v-if="lyrics.isPending.value" class="h-48" />
		<p v-else-if="lyrics.isError.value" class="text-sm text-muted-foreground">
			{{ getErrorMessage(lyrics.error.value) }}
		</p>
		<p v-else-if="!lyrics.data.value" class="text-sm text-muted-foreground">{{ $t("music.lyrics.notFound") }}</p>

		<div
			v-else
			ref="container"
			class="relative max-h-96 overflow-y-auto pr-2"
			@wheel.passive="pauseFollow"
			@touchmove.passive="pauseFollow"
		>
			<template v-if="lines.length">
				<p
					v-for="(line, i) in lines"
					:key="i"
					:ref="el => (lineElements[i] = el as HTMLElement)"
					:class="
						cn(
							'min-h-6 py-0.5 transition-colors duration-300',
							i === activeIndex
								? 'font-semibold text-hl'
								: i < activeIndex
									? 'text-muted-foreground/60'
									: 'text-muted-foreground',
							canSeek && 'cursor-pointer hover:text-foreground',
						)
					"
					@click="canSeek && emit('seek', line.time)"
				>
					{{ line.text || "♪" }}
				</p>
			</template>
			<p v-else class="whitespace-pre-line text-muted-foreground">{{ lyrics.data.value.text }}</p>
		</div>
	</section>
</template>
