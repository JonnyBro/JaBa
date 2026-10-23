<script setup lang="ts">
import AppFooter from "@/components/layout/AppFooter.vue";
import AppHeader from "@/components/layout/AppHeader.vue";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useTheme } from "@/lib/theme";
import { RouterView } from "vue-router";

const { isDark } = useTheme();
</script>

<template>
	<TooltipProvider :delay-duration="200">
		<div class="flex min-h-dvh flex-col">
			<AppHeader />
			<main class="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:py-8">
				<RouterView v-slot="{ Component, route }">
					<component :is="Component" :key="route.path" />
				</RouterView>
			</main>
			<AppFooter />
		</div>
		<Toaster :theme="isDark ? 'dark' : 'light'" position="bottom-right" rich-colors />
	</TooltipProvider>
</template>
