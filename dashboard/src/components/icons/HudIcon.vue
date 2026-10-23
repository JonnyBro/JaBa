<script setup lang="ts">
// Line icons drawn for the site. The stroke keeps the same width at any size so they stay readable when small
export type HudIconName = "copy" | "downloads" | "objects" | "plays";

defineProps<{ name: HudIconName }>();

const paths: Record<HudIconName, string[]> = {
	copy: ["M 0.5,0.5 V 25.706 H 8.16 V 8.16 H 25.706 V 0.5 Z", "M 8.16,8.16 V 33.366 H 33.366 V 8.16 Z"],
	downloads: ["M 33.045,0.5 16.748,32.745 0.815,0.5 Z", "M 0,33.366 H 33.867"],
	objects: [
		"M 8.16,0.5 0.5,8.234 V 33.44 H 25.706 L 33.366,25.706 V 0.5 Z",
		"M 25.706,8.234 33.366,0.5",
		"M 0.5,8.234 H 25.706 V 33.44",
	],
	plays: ["M 0.503,0.821 32.747,17.118 0.503,33.051 Z"],
};
</script>

<template>
	<svg
		viewBox="0 0 33.867 33.867"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linejoin="miter"
		class="size-4 shrink-0 overflow-visible"
		aria-hidden="true"
	>
		<path v-for="d in paths[name]" :key="d" :d="d" vector-effect="non-scaling-stroke" />
	</svg>
</template>
