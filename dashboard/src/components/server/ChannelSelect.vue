<script setup lang="ts">
import type { GuildChannel } from "@/api/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// reka-ui selects can't hold an empty value
const NONE = "none";

const props = defineProps<{ channels: GuildChannel[]; nullable?: boolean; id?: string }>();
const model = defineModel<string | null>({ required: true });

const { t } = useI18n();

const value = computed({
	get: () => model.value ?? (props.nullable ? NONE : ""),
	set: v => (model.value = v === NONE ? null : v),
});

// By default the trigger copies the item's whole text, the category included and glued to the name
const label = computed(() => {
	if (value.value === NONE) return t("server.disabled");

	const channel = props.channels.find(c => c.id === value.value);

	return channel ? `#${channel.name}` : t("server.pickChannel");
});
</script>

<template>
	<Select :id="id" v-model="value">
		<SelectTrigger class="w-full">
			<SelectValue :placeholder="$t('server.pickChannel')">{{ label }}</SelectValue>
		</SelectTrigger>
		<SelectContent>
			<SelectItem v-if="nullable" :value="NONE">{{ $t("server.disabled") }}</SelectItem>
			<SelectItem v-for="channel in channels" :key="channel.id" :value="channel.id">
				<span class="truncate">#{{ channel.name }}</span>
				<span v-if="channel.category" class="ml-auto text-muted-foreground">{{ channel.category }}</span>
			</SelectItem>
		</SelectContent>
	</Select>
</template>
