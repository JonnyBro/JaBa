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
import { themes, useTheme, type ThemeName } from "@/lib/theme";
import { Palette } from "lucide-vue-next";

const { theme } = useTheme();

const select = (value: unknown) => (theme.value = value as ThemeName);
</script>

<template>
	<DropdownMenu>
		<DropdownMenuTrigger as-child>
			<Button variant="ghost" size="icon" :aria-label="$t('header.theme')">
				<Palette />
			</Button>
		</DropdownMenuTrigger>
		<DropdownMenuContent align="end" class="w-52">
			<DropdownMenuLabel class="font-display text-muted-foreground">{{ $t("header.theme") }}</DropdownMenuLabel>
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
					<span class="font-display">{{ t.label }}</span>
				</DropdownMenuRadioItem>
			</DropdownMenuRadioGroup>
		</DropdownMenuContent>
	</DropdownMenu>
</template>
