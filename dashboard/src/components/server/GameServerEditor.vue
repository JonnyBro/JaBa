<script setup lang="ts">
import { createGameServer, previewGameServer, testGameServer, updateGameServer } from "@/api";
import {
	GAME_SERVER_FIELDS,
	GAME_SERVER_INTERVAL,
	GAME_SERVER_MAX_DESCRIPTION,
	RAW_FIELD_PREFIX,
	type GameInfo,
	type GameServer,
	type GameServerField,
	type GameServerInput,
	type GameServerPreview,
	type GameServerState,
	type GameServerTest,
	type GuildDetails,
} from "@/api/types";
import ChannelSelect from "@/components/server/ChannelSelect.vue";
import MessagePreview from "@/components/server/MessagePreview.vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/plugins/axios";
import { ArrowDown, ArrowUp, CircleCheck, CircleX, Columns2, LoaderCircle, Radar, Save, X } from "@lucide/vue";
import { useMutation } from "@tanstack/vue-query";
import { computed, onBeforeUnmount, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";

const POPULAR_GAMES = ["garrysmod", "minecraft"];
const SHOWN_GAMES = 50;
const MAX_FIELDS = 20;
const MAX_LABEL = 50;
const DEFAULT_FIELDS: GameServerField[] = ["name", "map", "players", "playerList", "address"];
const PREVIEW_DELAY = 400;

const props = defineProps<{ guild: GuildDetails; games: GameInfo[]; server: GameServer | null }>();
const emit = defineEmits<{ saved: []; cancel: [] }>();

const { t } = useI18n();

const firstGame = props.server?.game ?? POPULAR_GAMES[0];

// Vue turns number inputs into numbers, but an emptied one gives back ""
const form = reactive({
	game: firstGame,
	host: props.server?.host ?? "",
	port: props.server?.port ?? props.games.find(g => g.id === firstGame)?.port ?? "",
	channelId: props.server?.channelId ?? null,
	title: props.server?.title ?? "",
	description: props.server?.description ?? "",
	connectButton: props.server?.connectButton ?? true,
	copyButton: props.server?.copyButton ?? true,
	interval: props.server?.interval ?? GAME_SERVER_INTERVAL.min,
});

const intervalValid = computed(
	() =>
		Number.isInteger(form.interval) &&
		form.interval >= GAME_SERVER_INTERVAL.min &&
		form.interval <= GAME_SERVER_INTERVAL.max,
);

let nextKey = 0;
const fields = ref(
	(props.server?.fields ?? DEFAULT_FIELDS.map(key => ({ key, label: null, inline: false }))).map(field => ({
		rowKey: nextKey++,
		key: field.key,
		label: field.label ?? "",
		inline: field.inline,
	})),
);

const state = ref<GameServerState | null>(props.server?.state ?? null);

// Game
const gameQuery = ref("");
const game = computed(() => props.games.find(g => g.id === form.game) ?? null);

const gameMatches = computed(() => {
	const query = gameQuery.value.trim().toLowerCase();
	if (query) return props.games.filter(g => g.name.toLowerCase().includes(query) || g.id.includes(query));

	const popular = props.games.filter(g => POPULAR_GAMES.includes(g.id));

	return [...popular, ...props.games.filter(g => !POPULAR_GAMES.includes(g.id))];
});

const pickGame = (picked: GameInfo) => {
	// The port follows the game while it's still the old game's default
	if (form.port === "" || form.port === game.value?.port) form.port = picked.port ?? "";

	form.game = picked.id;
	gameQuery.value = "";
};

// Test
const target = computed(() => ({ game: form.game, host: form.host.trim(), port: Number(form.port) || 0 }));
const testResult = ref<GameServerTest | null>(null);

const test = useMutation({
	mutationFn: () => testGameServer(props.guild.id, target.value),
	onSuccess: result => {
		testResult.value = result;
		if (result.ok) state.value = result.state;
	},
	onError: error => toast.error(getErrorMessage(error)),
});

watch(target, () => (testResult.value = null), { deep: true });

// Fields
const isStandard = (key: string): key is GameServerField => GAME_SERVER_FIELDS.includes(key as GameServerField);

const defaultLabel = (key: string) =>
	isStandard(key) ? t(`gameservers.fields.${key}`) : key.slice(RAW_FIELD_PREFIX.length);

const sample = (key: string) => state.value?.raw.find(e => `${RAW_FIELD_PREFIX}${e.key}` === key)?.value;

const unusedStandard = computed(() => GAME_SERVER_FIELDS.filter(key => !fields.value.some(f => f.key === key)));
const unusedRaw = computed(() =>
	(state.value?.raw ?? [])
		.map(entry => `${RAW_FIELD_PREFIX}${entry.key}`)
		.filter(key => !fields.value.some(f => f.key === key)),
);

// The select only serves to pick a field, it goes back to empty right after
const toAdd = ref("");
watch(toAdd, key => {
	if (!key) return;

	fields.value.push({ rowKey: nextKey++, key, label: "", inline: false });
	toAdd.value = "";
});

const moveField = (index: number, by: number) => {
	const list = fields.value;
	[list[index], list[index + by]] = [list[index + by], list[index]];
};

const removeField = (rowKey: number) => (fields.value = fields.value.filter(f => f.rowKey !== rowKey));

// Preview
const payloadFields = computed(() =>
	fields.value.map(f => ({ key: f.key, label: f.label.trim() || null, inline: f.inline })),
);

const previewBody = computed(() => ({
	...target.value,
	title: form.title.trim() || null,
	description: form.description.trim() || null,
	fields: payloadFields.value,
	connectButton: form.connectButton,
	copyButton: form.copyButton,
	interval: intervalValid.value ? form.interval : GAME_SERVER_INTERVAL.min,
	state: state.value,
	lastOnline: props.server?.lastOnline ?? null,
}));

const preview = ref<GameServerPreview | null>(null);
let previewTimer: ReturnType<typeof setTimeout> | undefined;

watch(
	previewBody,
	body => {
		clearTimeout(previewTimer);
		if (!body.host || !body.port) return void (preview.value = null);

		previewTimer = setTimeout(async () => {
			preview.value = await previewGameServer(props.guild.id, body).catch(() => preview.value);
		}, PREVIEW_DELAY);
	},
	{ immediate: true, deep: true },
);

onBeforeUnmount(() => clearTimeout(previewTimer));

// Save
const payload = computed<GameServerInput>(() => ({
	...target.value,
	channelId: form.channelId ?? "",
	title: form.title.trim() || null,
	description: form.description.trim() || null,
	fields: payloadFields.value,
	connectButton: form.connectButton,
	copyButton: form.copyButton,
	interval: form.interval,
}));

const canSave = computed(() => !!form.channelId && !!target.value.host && !!target.value.port && intervalValid.value);

const save = useMutation({
	mutationFn: () =>
		props.server
			? updateGameServer(props.guild.id, props.server.id, payload.value)
			: createGameServer(props.guild.id, payload.value),
	onSuccess: () => {
		toast.success(t("gameservers.saved"));
		emit("saved");
	},
	onError: error => toast.error(getErrorMessage(error)),
});
</script>

<template>
	<form class="hud-panel grid gap-6 p-4 lg:grid-cols-2" @submit.prevent="save.mutate()">
		<div class="space-y-4">
			<h2 class="hud-title text-lg">
				{{ server ? $t("gameservers.editTitle") : $t("gameservers.addTitle") }}
			</h2>

			<div class="space-y-2">
				<Label for="gs-game">{{ $t("gameservers.game") }}</Label>
				<p class="text-sm">
					<span class="font-medium">{{ game?.name ?? form.game }}</span>
				</p>
				<Input id="gs-game" v-model="gameQuery" :placeholder="$t('gameservers.gameSearch')" />
				<div class="max-h-44 overflow-y-auto rounded-md border">
					<button
						v-for="item in gameMatches.slice(0, SHOWN_GAMES)"
						:key="item.id"
						type="button"
						:class="
							cn(
								'block w-full px-3 py-1.5 text-left text-sm hover:bg-accent',
								item.id === form.game && 'bg-accent font-medium',
							)
						"
						@click="pickGame(item)"
					>
						{{ item.name }}
					</button>
					<p v-if="!gameMatches.length" class="px-3 py-2 text-sm text-muted-foreground">
						{{ $t("gameservers.noGames") }}
					</p>
				</div>
			</div>

			<div class="grid grid-cols-[1fr_7rem] gap-3">
				<div class="space-y-2">
					<Label for="gs-host">{{ $t("gameservers.host") }}</Label>
					<Input id="gs-host" v-model="form.host" placeholder="play.example.com" maxlength="253" />
				</div>
				<div class="space-y-2">
					<Label for="gs-port">{{ $t("gameservers.port") }}</Label>
					<Input id="gs-port" v-model="form.port" type="number" min="1" max="65535" />
				</div>
			</div>

			<div class="flex flex-wrap items-center gap-3">
				<Button
					type="button"
					variant="outline"
					:disabled="!target.host || !target.port || test.isPending.value"
					@click="test.mutate()"
				>
					<LoaderCircle v-if="test.isPending.value" class="animate-spin" />
					<Radar v-else />
					{{ $t("gameservers.test") }}
				</Button>
				<p v-if="testResult?.ok" class="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
					<CircleCheck class="size-4 shrink-0" />
					{{
						$t("gameservers.testOk", {
							name: testResult.state.name || target.host,
							players: `${testResult.state.numplayers}/${testResult.state.maxplayers}`,
						})
					}}
				</p>
				<p v-else-if="testResult" class="flex items-center gap-1.5 text-sm text-destructive">
					<CircleX class="size-4 shrink-0" />
					{{ $t(`gameservers.errors.${testResult.reason}`) }}
				</p>
			</div>

			<div class="grid gap-3 sm:grid-cols-2">
				<div class="space-y-2">
					<Label for="gs-channel">{{ $t("gameservers.channel") }}</Label>
					<ChannelSelect id="gs-channel" v-model="form.channelId" :channels="guild.channels" />
				</div>
				<div class="space-y-2">
					<Label for="gs-title">{{ $t("gameservers.title") }}</Label>
					<Input
						id="gs-title"
						v-model="form.title"
						maxlength="100"
						:placeholder="state?.name || $t('gameservers.titlePlaceholder')"
					/>
				</div>
				<div class="space-y-2">
					<Label for="gs-interval">{{ $t("gameservers.interval") }}</Label>
					<Input
						id="gs-interval"
						v-model="form.interval"
						type="number"
						:min="GAME_SERVER_INTERVAL.min"
						:max="GAME_SERVER_INTERVAL.max"
					/>
					<p class="text-xs text-muted-foreground">
						{{ $t("gameservers.intervalHint", GAME_SERVER_INTERVAL) }}
					</p>
				</div>
			</div>

			<div class="space-y-2">
				<Label for="gs-description">{{ $t("gameservers.description") }}</Label>
				<textarea
					id="gs-description"
					v-model="form.description"
					rows="3"
					:maxlength="GAME_SERVER_MAX_DESCRIPTION"
					:placeholder="$t('gameservers.descriptionPlaceholder')"
					class="w-full resize-y rounded-md border border-input bg-card px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-hl"
				/>
				<p class="text-xs text-muted-foreground">{{ $t("gameservers.descriptionHint") }}</p>
			</div>

			<div class="space-y-2">
				<div>
					<Label>{{ $t("gameservers.fieldsTitle") }}</Label>
					<p class="text-xs text-muted-foreground">{{ $t("gameservers.fieldsHint") }}</p>
				</div>

				<div v-for="(field, index) in fields" :key="field.rowKey" class="flex items-center gap-2">
					<div class="flex flex-col">
						<button
							type="button"
							class="text-muted-foreground hover:text-foreground disabled:opacity-30"
							:disabled="index === 0"
							:aria-label="$t('gameservers.moveUp')"
							@click="moveField(index, -1)"
						>
							<ArrowUp class="size-3.5" />
						</button>
						<button
							type="button"
							class="text-muted-foreground hover:text-foreground disabled:opacity-30"
							:disabled="index === fields.length - 1"
							:aria-label="$t('gameservers.moveDown')"
							@click="moveField(index, 1)"
						>
							<ArrowDown class="size-3.5" />
						</button>
					</div>
					<Input
						v-model="field.label"
						class="h-8 flex-1"
						:maxlength="MAX_LABEL"
						:placeholder="defaultLabel(field.key)"
						:aria-label="$t('gameservers.fieldLabel')"
					/>
					<code class="max-w-40 truncate text-xs text-muted-foreground" :title="field.key">
						{{ field.key }}
					</code>
					<button
						type="button"
						:class="
							cn(
								'rounded p-1 hover:text-foreground',
								field.inline ? 'bg-hl/15 text-hl' : 'text-muted-foreground',
							)
						"
						:aria-pressed="field.inline"
						:aria-label="$t('gameservers.inline')"
						:title="$t('gameservers.inline')"
						@click="field.inline = !field.inline"
					>
						<Columns2 class="size-4" />
					</button>
					<button
						type="button"
						class="text-muted-foreground hover:text-foreground"
						:aria-label="$t('common.delete')"
						@click="removeField(field.rowKey)"
					>
						<X class="size-4" />
					</button>
				</div>

				<Select v-model="toAdd" :disabled="fields.length >= MAX_FIELDS">
					<SelectTrigger class="w-full sm:w-72">
						<SelectValue>{{ $t("gameservers.addField") }}</SelectValue>
					</SelectTrigger>
					<SelectContent>
						<SelectItem v-for="key in unusedStandard" :key="key" :value="key">
							{{ defaultLabel(key) }}
						</SelectItem>
						<SelectItem v-for="key in unusedRaw" :key="key" :value="key">
							<span class="truncate">{{ defaultLabel(key) }}</span>
							<span class="ml-auto max-w-32 truncate text-muted-foreground">{{ sample(key) }}</span>
						</SelectItem>
					</SelectContent>
				</Select>
				<p v-if="!state" class="text-xs text-muted-foreground">{{ $t("gameservers.rawHint") }}</p>
			</div>

			<Label v-if="game?.steam" class="flex items-center gap-2 font-normal">
				<input v-model="form.connectButton" type="checkbox" class="accent-hl" />
				{{ $t("gameservers.connectButton") }}
			</Label>
			<Label class="flex items-center gap-2 font-normal">
				<input v-model="form.copyButton" type="checkbox" class="accent-hl" />
				{{ $t("gameservers.copyButton") }}
			</Label>
		</div>

		<div class="space-y-4">
			<MessagePreview v-if="preview" :blocks="[{ type: 'text', content: preview.text }]" :color="preview.color">
				<div v-if="preview.buttons.length" class="flex flex-wrap gap-2">
					<span
						v-for="button in preview.buttons"
						:key="button.label"
						class="inline-block rounded bg-[rgb(78_80_88)] px-3 py-1.5 text-white"
					>
						{{ button.label }}{{ button.url ? " ↗" : "" }}
					</span>
				</div>
			</MessagePreview>
			<p v-else class="text-sm text-muted-foreground">{{ $t("gameservers.previewHint") }}</p>
			<p v-if="!state" class="text-xs text-muted-foreground">{{ $t("gameservers.previewOffline") }}</p>
		</div>

		<div class="flex justify-end gap-2 lg:col-span-2">
			<Button type="button" variant="ghost" @click="emit('cancel')">{{ $t("common.cancel") }}</Button>
			<Button type="submit" :disabled="!canSave || save.isPending.value">
				<LoaderCircle v-if="save.isPending.value" class="animate-spin" />
				<Save v-else />
				{{ $t("common.save") }}
			</Button>
		</div>
	</form>
</template>
