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
import { accents, themes, useTheme, type AccentName, type ThemeName } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { Check, Palette } from "lucide-vue-next";

const { theme, accent } = useTheme();

const select = (value: unknown) => (theme.value = value as ThemeName);
const selectAccent = (value: AccentName) => (accent.value = value);
</script>

<template>
	<DropdownMenu>
		<DropdownMenuTrigger as-child>
			<Button variant="ghost" size="icon" :aria-label="$t('header.theme')">
				<Palette />
			</Button>
		</DropdownMenuTrigger>
		<DropdownMenuContent align="end" class="w-52">
			<DropdownMenuLabel class="font-hud text-muted-foreground">{{ $t("header.theme") }}</DropdownMenuLabel>
			<DropdownMenuSeparator />
			<DropdownMenuRadioGroup :model-value="theme" @update:model-value="select">
				<DropdownMenuRadioItem v-for="t in themes" :key="t.name" :value="t.name" class="gap-3">
					<span class="flex shrink-0 border border-foreground/20">
						<span
							v-for="color in t.colors"
							:key="color"
							class="size-3"
							:style="{ backgroundColor: color }"
						/>
					</span>
					{{ $t(t.label) }}
				</DropdownMenuRadioItem>
			</DropdownMenuRadioGroup>

			<DropdownMenuSeparator />
			<DropdownMenuLabel class="font-hud text-muted-foreground">{{ $t("theme.accent") }}</DropdownMenuLabel>
			<div class="flex gap-1.5 px-2 pb-2">
				<button
					v-for="a in accents"
					:key="a.name"
					type="button"
					:aria-label="$t(a.label)"
					:title="$t(a.label)"
					:class="
						cn(
							'flex size-7 cursor-pointer items-center justify-center border border-foreground/20 text-white',
							accent === a.name && 'outline-2 outline-offset-1 outline-foreground',
						)
					"
					:style="{ backgroundColor: a.color }"
					@click="selectAccent(a.name)"
				>
					<Check v-if="accent === a.name" class="size-4" />
				</button>
			</div>
		</DropdownMenuContent>
	</DropdownMenu>
</template>
