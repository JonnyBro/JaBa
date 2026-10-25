<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/composables/useAuth";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-vue-next";
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { GitHubIcon } from "vue3-simple-icons";
import LanguagePicker from "./LanguagePicker.vue";
import ThemePicker from "./ThemePicker.vue";
import UserMenu from "./UserMenu.vue";

const { isLoggedIn, isOwner } = useAuth();
const route = useRoute();
const mobileOpen = ref(false);

watch(
	() => route.fullPath,
	() => (mobileOpen.value = false),
);

const nav = computed(() => [
	{ name: "home", label: "header.home" },
	{ name: "commands", label: "header.commands" },
	{ name: "leaderboard", label: "header.leaderboard" },
	...(isLoggedIn.value
		? [
			{ name: "servers", label: "header.servers" },
			{ name: "playlists", label: "header.playlists" },
		]
		: []),
	...(isOwner.value ? [{ name: "owner", label: "header.owner" }] : []),
]);

const links = [{ label: "header.github", icon: GitHubIcon, href: "https://github.com/JonnyBro/JaBa" }];

const isActive = (name: string) => route.matched.some(r => r.name === name || r.meta.section === name);
</script>

<template>
	<header class="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
		<div class="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4">
			<RouterLink
				:to="{ name: 'home' }"
				class="flex items-baseline gap-2 font-hud text-lg transition-colors hover:text-hl"
			>
				<span>JaBa</span>
				<span class="hidden text-sm text-muted-foreground sm:inline">{{ $t("header.subtitle") }}</span>
			</RouterLink>

			<nav class="hidden h-full items-stretch gap-1 md:flex">
				<RouterLink
					v-for="item in nav"
					:key="item.name"
					:to="{ name: item.name }"
					:class="
						cn(
							'flex items-center border-b-2 border-transparent px-3 font-hud text-sm text-muted-foreground transition-colors hover:text-hl',
							isActive(item.name) && 'border-hl text-foreground',
						)
					"
				>
					{{ $t(item.label) }}
				</RouterLink>
			</nav>

			<div class="ml-auto flex items-center gap-1">
				<Button
					v-for="link in links"
					:key="link.href"
					as="a"
					:href="link.href"
					target="_blank"
					rel="noopener"
					variant="ghost"
					size="icon"
					class="hidden md:inline-flex"
					:aria-label="$t(link.label)"
				>
					<component :is="link.icon" class="size-4" />
				</Button>
				<LanguagePicker />
				<ThemePicker />
				<UserMenu />

				<Sheet v-model:open="mobileOpen">
					<SheetTrigger as-child>
						<Button variant="ghost" size="icon" class="md:hidden" :aria-label="$t('header.menu')">
							<Menu />
						</Button>
					</SheetTrigger>
					<SheetContent side="left" class="w-72">
						<SheetHeader>
							<SheetTitle class="font-hud">JaBa</SheetTitle>
						</SheetHeader>
						<nav class="flex flex-col px-4">
							<RouterLink
								v-for="item in nav"
								:key="item.name"
								:to="{ name: item.name }"
								:class="
									cn(
										'border-l-2 border-transparent px-3 py-2 font-hud text-muted-foreground hover:text-hl',
										isActive(item.name) && 'border-hl text-foreground',
									)
								"
							>
								{{ $t(item.label) }}
							</RouterLink>
							<div class="my-3 border-t" />
							<a
								v-for="link in links"
								:key="link.href"
								:href="link.href"
								target="_blank"
								rel="noopener"
								class="flex items-center gap-2 px-3 py-2 font-hud text-sm text-muted-foreground hover:text-hl"
							>
								<component :is="link.icon" class="size-4" />
								{{ $t(link.label) }}
							</a>
						</nav>
					</SheetContent>
				</Sheet>
			</div>
		</div>
	</header>
</template>
