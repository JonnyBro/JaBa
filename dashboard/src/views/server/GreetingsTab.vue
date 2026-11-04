<script setup lang="ts">
import { getGreetings, testGreeting, updateGreetings } from "@/api";
import type { GreetingKind, GreetingMessage, GreetingSettings, GuildDetails, MessageBlock } from "@/api/types";
import ErrorState from "@/components/common/ErrorState.vue";
import BlocksEditor from "@/components/server/BlocksEditor.vue";
import ChannelSelect from "@/components/server/ChannelSelect.vue";
import MessagePreview from "@/components/server/MessagePreview.vue";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/composables/useAuth";
import { cleanBlocks, fillBlocks } from "@/lib/blocks";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/plugins/axios";
import { FlaskConical, LoaderCircle, Save } from "@lucide/vue";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";

const KINDS: GreetingKind[] = ["welcome", "goodbye", "dm"];
const MAX_AUTOROLES = 10;

const props = defineProps<{ guild: GuildDetails }>();

const { t } = useI18n();
const { me } = useAuth();
const queryClient = useQueryClient();

const greetings = useQuery({
	queryKey: ["guild", props.guild.id, "greetings"],
	queryFn: () => getGreetings(props.guild.id),
});

type Form = Record<GreetingKind, GreetingMessage & { useColor: boolean }> & { autoroles: string[] };

// The locale strings show the placeholders themselves, and vue-i18n would otherwise swap them for nothing
const PLACEHOLDERS = { user: "{user}", username: "{username}", server: "{server}", count: "{count}" };

const defaultColor = props.guild.embedColor ?? "#5865F2";
const starterBlocks = (kind: GreetingKind): MessageBlock[] => [
	{ type: "text", content: t(`greetings.starter.${kind}`, PLACEHOLDERS) },
];

const toForm = (kind: GreetingKind, message: GreetingMessage) => ({
	...message,
	blocks: message.blocks.length ? structuredClone(message.blocks) : starterBlocks(kind),
	color: message.color ?? defaultColor,
	useColor: message.color !== null,
});

const form = reactive<Form>({
	welcome: toForm("welcome", { enabled: false, channel: null, blocks: [], color: null, avatar: true }),
	goodbye: toForm("goodbye", { enabled: false, channel: null, blocks: [], color: null, avatar: true }),
	dm: toForm("dm", { enabled: false, channel: null, blocks: [], color: null, avatar: false }),
	autoroles: [],
});

const kind = ref<GreetingKind>("welcome");

const reset = (settings: GreetingSettings) => {
	for (const k of KINDS) form[k] = toForm(k, settings[k]);
	form.autoroles = [...settings.autoroles];
};

watch(
	() => greetings.data.value,
	data => data && reset(data),
	{ immediate: true },
);

const toMessage = (k: GreetingKind): GreetingMessage => {
	const message = form[k];

	return {
		enabled: message.enabled,
		channel: k === "dm" ? null : message.channel,
		blocks: cleanBlocks(message.blocks),
		color: message.useColor ? message.color : null,
		avatar: message.avatar,
	};
};

const payload = computed<GreetingSettings>(() => ({
	welcome: toMessage("welcome"),
	goodbye: toMessage("goodbye"),
	dm: toMessage("dm"),
	autoroles: [...form.autoroles],
}));

const saved = computed<GreetingSettings | null>(() => {
	const data = greetings.data.value;
	if (!data) return null;

	const pick = (k: GreetingKind) => ({
		...data[k],
		channel: k === "dm" ? null : data[k].channel,
		blocks: data[k].blocks.length ? data[k].blocks : cleanBlocks(starterBlocks(k)),
	});

	return { welcome: pick("welcome"), goodbye: pick("goodbye"), dm: pick("dm"), autoroles: data.autoroles };
});

const isDirty = computed(() => JSON.stringify(payload.value) !== JSON.stringify(saved.value));

const current = computed(() => form[kind.value]);

const sampleVars = computed(() => ({
	user: `@${me.value?.displayName ?? "user"}`,
	username: me.value?.username ?? "user",
	server: props.guild.name,
	count: formatNumber(props.guild.memberCount),
}));

const preview = computed(() => fillBlocks(cleanBlocks(current.value.blocks), sampleVars.value));

const save = useMutation({
	mutationFn: () => updateGreetings(props.guild.id, payload.value),
	onSuccess: settings => {
		queryClient.setQueryData(["guild", props.guild.id, "greetings"], { ...greetings.data.value, ...settings });
		toast.success(t("greetings.saved"));
	},
	onError: error => toast.error(getErrorMessage(error)),
});

const test = useMutation({
	mutationFn: () => testGreeting(props.guild.id, kind.value, toMessage(kind.value)),
	onSuccess: () => toast.success(t(kind.value === "dm" ? "greetings.testSentDm" : "greetings.testSent")),
	onError: error => toast.error(getErrorMessage(error)),
});

const toggleRole = (id: string, on: boolean) => {
	form.autoroles = on ? [...form.autoroles, id] : form.autoroles.filter(roleId => roleId !== id);
};
</script>

<template>
	<ErrorState v-if="greetings.isError.value" :error="greetings.error.value" @retry="greetings.refetch()" />
	<Skeleton v-else-if="greetings.isPending.value" class="h-96" />

	<form v-else-if="greetings.data.value" class="space-y-6" @submit.prevent="save.mutate()">
		<nav class="flex flex-wrap gap-1">
			<Button
				v-for="k in KINDS"
				:key="k"
				type="button"
				size="sm"
				:variant="kind === k ? 'default' : 'outline'"
				@click="kind = k"
			>
				{{ $t(`greetings.kinds.${k}`) }}
				<span
					:class="cn('size-1.5 rounded-full', form[k].enabled ? 'bg-emerald-500' : 'bg-muted-foreground/40')"
				/>
			</Button>
		</nav>

		<div class="grid gap-6 lg:grid-cols-2">
			<div class="space-y-4">
				<div class="hud-panel grid gap-4 p-4 sm:grid-cols-2">
					<p class="text-sm text-muted-foreground sm:col-span-2">{{ $t(`greetings.hints.${kind}`) }}</p>

					<Label class="flex items-center gap-2 font-normal sm:col-span-2">
						<input v-model="current.enabled" type="checkbox" class="accent-hl" />
						{{ $t("greetings.enabled") }}
					</Label>

					<div v-if="kind !== 'dm'" class="space-y-2 sm:col-span-2">
						<Label :for="`greeting-channel-${kind}`">{{ $t("greetings.channel") }}</Label>
						<ChannelSelect
							:id="`greeting-channel-${kind}`"
							v-model="current.channel"
							:channels="guild.channels"
						/>
					</div>

					<Label class="flex items-center gap-2 font-normal">
						<input v-model="current.useColor" type="checkbox" class="accent-hl" />
						{{ $t("messages.color") }}
						<input
							v-if="current.useColor"
							v-model="current.color"
							type="color"
							class="h-6 w-10 cursor-pointer bg-transparent"
						/>
					</Label>
					<Label class="flex items-center gap-2 font-normal">
						<input v-model="current.avatar" type="checkbox" class="accent-hl" />
						{{ $t("greetings.avatar") }}
					</Label>

					<p class="text-xs text-muted-foreground sm:col-span-2">
						{{ $t("greetings.placeholders", PLACEHOLDERS) }}
					</p>
				</div>

				<BlocksEditor v-model="current.blocks" :placeholder="$t(`greetings.starter.${kind}`, PLACEHOLDERS)">
					<Button
						type="button"
						variant="outline"
						size="sm"
						class="ml-auto"
						:disabled="!preview.length || (kind !== 'dm' && !current.channel) || test.isPending.value"
						@click="test.mutate()"
					>
						<LoaderCircle v-if="test.isPending.value" class="animate-spin" />
						<FlaskConical v-else />
						{{ $t("greetings.test") }}
					</Button>
				</BlocksEditor>
			</div>

			<div class="lg:sticky lg:top-20 lg:self-start">
				<MessagePreview
					:blocks="preview"
					:color="current.useColor ? current.color : null"
					:thumbnail="current.avatar ? me?.avatar : null"
				/>
			</div>
		</div>

		<section class="hud-panel space-y-3 p-4">
			<div>
				<h2 class="hud-title text-lg">{{ $t("greetings.autorolesTitle") }}</h2>
				<p class="text-sm text-muted-foreground">{{ $t("greetings.autorolesHint", { max: MAX_AUTOROLES }) }}</p>
			</div>

			<p v-if="!greetings.data.value.roles.length" class="text-sm text-muted-foreground">
				{{ $t("greetings.noRoles") }}
			</p>
			<div v-else class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
				<Label
					v-for="role in greetings.data.value.roles"
					:key="role.id"
					class="flex items-center gap-2 font-normal"
				>
					<input
						type="checkbox"
						class="accent-hl"
						:checked="form.autoroles.includes(role.id)"
						:disabled="!form.autoroles.includes(role.id) && form.autoroles.length >= MAX_AUTOROLES"
						@change="toggleRole(role.id, ($event.target as HTMLInputElement).checked)"
					/>
					<span class="size-2.5 shrink-0 rounded-full" :style="{ backgroundColor: role.color }" />
					<span class="truncate">{{ role.name }}</span>
				</Label>
			</div>
		</section>

		<div class="flex justify-end gap-2">
			<Button type="button" variant="ghost" :disabled="!isDirty" @click="reset(greetings.data.value)">
				{{ $t("common.cancel") }}
			</Button>
			<Button type="submit" :disabled="!isDirty || save.isPending.value">
				<LoaderCircle v-if="save.isPending.value" class="animate-spin" />
				<Save v-else />
				{{ $t("common.save") }}
			</Button>
		</div>
	</form>
</template>
