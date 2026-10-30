<script setup lang="ts">
import { updateGuildSettings } from "@/api";
import type { GuildDetails, GuildSettings } from "@/api/types";
import ChannelSelect from "@/components/server/ChannelSelect.vue";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getErrorMessage } from "@/plugins/axios";
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { LoaderCircle, Save } from "@lucide/vue";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";

const props = defineProps<{ guild: GuildDetails }>();

const { t } = useI18n();
const queryClient = useQueryClient();

const language = ref("");
const birthdays = ref<string | null>(null);

const reset = (settings: GuildSettings) => {
	language.value = settings.language;
	birthdays.value = settings.birthdays;
};

watch(() => props.guild.settings, reset, { immediate: true });

const changes = computed(() => ({
	...(language.value !== props.guild.settings.language && { language: language.value }),
	...(birthdays.value !== props.guild.settings.birthdays && { birthdays: birthdays.value }),
}));

const isDirty = computed(() => Object.keys(changes.value).length > 0);

const save = useMutation({
	mutationFn: () => updateGuildSettings(props.guild.id, changes.value),
	onSuccess: settings => {
		queryClient.setQueryData(["guild", props.guild.id], { ...props.guild, settings });
		toast.success(t("server.saved"));
	},
	onError: error => toast.error(getErrorMessage(error)),
});
</script>

<template>
	<form class="hud-panel grid gap-6 p-4 sm:grid-cols-2" @submit.prevent="save.mutate()">
		<div class="space-y-2">
			<Label for="language">{{ $t("server.language") }}</Label>
			<Select id="language" v-model="language">
				<SelectTrigger class="w-full">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem v-for="lang in guild.languages" :key="lang.locale" :value="lang.locale">
						{{ lang.nativeName }}
					</SelectItem>
				</SelectContent>
			</Select>
		</div>

		<div class="space-y-2">
			<Label for="birthdays">{{ $t("server.birthdays") }}</Label>
			<ChannelSelect id="birthdays" v-model="birthdays" :channels="guild.channels" nullable />
		</div>

		<div class="flex justify-end gap-2 sm:col-span-2">
			<Button type="button" variant="ghost" :disabled="!isDirty" @click="reset(guild.settings)">
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
