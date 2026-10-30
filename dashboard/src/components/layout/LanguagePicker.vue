<script setup lang="ts">
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isAutoLocale, locales, setLocale } from "@/i18n";
import { Languages } from "@lucide/vue";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const AUTO = "auto";

const { locale } = useI18n();

const selected = computed(() => (isAutoLocale.value ? AUTO : locale.value));
const select = (value: unknown) => setLocale(value === AUTO ? null : String(value));
</script>

<template>
	<DropdownMenu>
		<DropdownMenuTrigger as-child>
			<Button variant="ghost" size="sm" class="px-2" :aria-label="$t('header.language')">
				<Languages />
				<span class="">{{ locale.split("-")[0] }}</span>
			</Button>
		</DropdownMenuTrigger>
		<DropdownMenuContent align="end" class="w-52">
			<DropdownMenuLabel class="font-hud text-muted-foreground">{{ $t("header.language") }}</DropdownMenuLabel>
			<DropdownMenuSeparator />
			<DropdownMenuRadioGroup :model-value="selected" @update:model-value="select">
				<DropdownMenuRadioItem :value="AUTO">{{ $t("header.languageAuto") }}</DropdownMenuRadioItem>
				<DropdownMenuRadioItem v-for="l in locales" :key="l.code" :value="l.code" :lang="l.code">
					{{ l.name }}
				</DropdownMenuRadioItem>
			</DropdownMenuRadioGroup>
		</DropdownMenuContent>
	</DropdownMenu>
</template>
