<script setup lang="ts">
import { getProfile, updateProfile } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/plugins/axios";
import { LoaderCircle, Save } from "@lucide/vue";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";

const MAX_BIO = 500;

const { t } = useI18n();
const queryClient = useQueryClient();
const profile = useQuery({ queryKey: ["profile"], queryFn: getProfile });

const pad = (n: number) => String(n).padStart(2, "0");
const toDateInput = (ms: number | null) => {
	if (!ms) return "";
	const date = new Date(ms);
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const bio = ref("");
const birthdate = ref("");

watch(
	() => profile.data.value,
	data => {
		if (!data) return;
		bio.value = data.bio ?? "";
		birthdate.value = toDateInput(data.birthdate);
	},
	{ immediate: true },
);

const saved = async () => {
	toast.success(t("profile.saved"));
	await queryClient.invalidateQueries({ queryKey: ["profile"] });
};
const onError = (error: unknown) => toast.error(getErrorMessage(error));

const saveBio = useMutation({
	mutationFn: () => updateProfile({ bio: bio.value.trim() || null }),
	onSuccess: saved,
	onError,
});

const saveBirthdate = useMutation({
	mutationFn: (clear: boolean = false) => {
		if (clear || !birthdate.value) return updateProfile({ birthdate: null });

		const [year, month, day] = birthdate.value.split("-").map(Number);
		return updateProfile({ birthdate: { day, month, year } });
	},
	onSuccess: saved,
	onError,
});

// Saved right away, it doesn't need the date to be saved again
const saveHideAge = useMutation({
	mutationFn: (hideAge: boolean) => updateProfile({ hideAge }),
	onSuccess: saved,
	onError,
});
</script>

<template>
	<Skeleton v-if="!profile.data.value" class="h-48" />

	<section v-else class="grid gap-4 lg:grid-cols-2">
		<form class="hud-panel space-y-3 p-4" @submit.prevent="saveBio.mutate()">
			<Label for="bio" class="hud-title text-lg">{{ $t("profile.bio") }}</Label>
			<textarea
				id="bio"
				v-model="bio"
				rows="4"
				:maxlength="MAX_BIO"
				:placeholder="$t('profile.bioPlaceholder')"
				class="w-full resize-y rounded-md border border-input bg-card px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-hl"
			/>
			<div class="flex items-center justify-between">
				<span class="font-hud text-sm text-muted-foreground">{{ bio.length }} / {{ MAX_BIO }}</span>
				<Button type="submit" size="sm" :disabled="saveBio.isPending.value">
					<LoaderCircle v-if="saveBio.isPending.value" class="animate-spin" />
					<Save v-else />
					{{ $t("common.save") }}
				</Button>
			</div>
		</form>

		<form class="hud-panel space-y-3 p-4" @submit.prevent="saveBirthdate.mutate(false)">
			<Label for="birthdate" class="hud-title text-lg">{{ $t("profile.birthdate") }}</Label>
			<p class="text-sm text-muted-foreground">{{ $t("profile.birthdateHint") }}</p>
			<Input id="birthdate" v-model="birthdate" type="date" :max="toDateInput(Date.now())" />
			<Label class="flex items-center gap-2 font-normal">
				<input
					type="checkbox"
					class="accent-hl"
					:checked="profile.data.value.hideAge"
					:disabled="saveHideAge.isPending.value"
					@change="saveHideAge.mutate(($event.target as HTMLInputElement).checked)"
				/>
				{{ $t("profile.hideAge") }}
			</Label>
			<div class="flex justify-end gap-2">
				<Button
					type="button"
					variant="ghost"
					size="sm"
					:disabled="!profile.data.value.birthdate || saveBirthdate.isPending.value"
					@click="saveBirthdate.mutate(true)"
				>
					{{ $t("profile.clear") }}
				</Button>
				<Button type="submit" size="sm" :disabled="!birthdate || saveBirthdate.isPending.value">
					<Save />
					{{ $t("common.save") }}
				</Button>
			</div>
		</form>
	</section>
</template>
