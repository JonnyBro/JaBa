<script setup lang="ts">
import { updateGuildSettings } from "@/api";
import type { GuildDetails, GuildSettings } from "@/api/types";
import ChannelSelect from "@/components/server/ChannelSelect.vue";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getErrorMessage } from "@/plugins/axios";
import { LoaderCircle, Save } from "@lucide/vue";
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";

// reka-ui selects can't hold an empty value
const NO_ROLE = "none";

const props = defineProps<{ guild: GuildDetails }>();

const { t } = useI18n();
const queryClient = useQueryClient();

const language = ref("");
const birthdays = ref<string | null>(null);
const djRole = ref(NO_ROLE);
const musicStay = ref(false);

const reset = (settings: GuildSettings) => {
	language.value = settings.language;
	birthdays.value = settings.birthdays;
	djRole.value = settings.djRole ?? NO_ROLE;
	musicStay.value = settings.musicStay;
};

watch(() => props.guild.settings, reset, { immediate: true });

const changes = computed(() => ({
	...(language.value !== props.guild.settings.language && { language: language.value }),
	...(birthdays.value !== props.guild.settings.birthdays && { birthdays: birthdays.value }),
	...((djRole.value === NO_ROLE ? null : djRole.value) !== props.guild.settings.djRole && {
		djRole: djRole.value === NO_ROLE ? null : djRole.value,
	}),
	...(musicStay.value !== props.guild.settings.musicStay && { musicStay: musicStay.value }),
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

		<h2 class="hud-title text-lg sm:col-span-2">{{ $t("server.musicTitle") }}</h2>

		<div class="space-y-2">
			<Label for="dj-role">{{ $t("server.djRole") }}</Label>
			<Select id="dj-role" v-model="djRole">
				<SelectTrigger class="w-full">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem :value="NO_ROLE">{{ $t("server.djRoleNone") }}</SelectItem>
					<SelectItem v-for="role in guild.roles" :key="role.id" :value="role.id">
						<span class="size-2.5 shrink-0 rounded-full" :style="{ backgroundColor: role.color }" />
						{{ role.name }}
					</SelectItem>
				</SelectContent>
			</Select>
			<p class="text-xs text-muted-foreground">{{ $t("server.djRoleHint") }}</p>
		</div>

		<div class="space-y-2">
			<Label class="flex items-center gap-2 font-normal sm:mt-7">
				<input v-model="musicStay" type="checkbox" class="accent-hl" />
				{{ $t("server.musicStay") }}
			</Label>
			<p class="text-xs text-muted-foreground">{{ $t("server.musicStayHint") }}</p>
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
