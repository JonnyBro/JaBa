import { useStorage } from "@vueuse/core";
import { computed, watchEffect } from "vue";

/**
 * Keep in sync with src/assets/css/themes.css and the inline script in index.html.
 * `colors` are only used for the preview in the theme picker: background and panel
 */
export const themes = [
	{ name: "dark", label: "theme.dark", dark: true, colors: ["rgb(14 14 16)", "rgb(34 34 39)"] },
	{ name: "light", label: "theme.light", dark: false, colors: ["rgb(244 244 246)", "rgb(214 214 222)"] },
	{ name: "amoled", label: "theme.amoled", dark: true, colors: ["rgb(0 0 0)", "rgb(24 24 28)"] },
] as const;

export const accents = [
	{ name: "red", label: "theme.accents.red", color: "rgb(235 45 45)" },
	{ name: "violet", label: "theme.accents.violet", color: "rgb(139 92 246)" },
	{ name: "green", label: "theme.accents.green", color: "rgb(34 197 94)" },
	{ name: "amber", label: "theme.accents.amber", color: "rgb(245 158 11)" },
	{ name: "blue", label: "theme.accents.blue", color: "rgb(59 130 246)" },
] as const;

export type ThemeName = (typeof themes)[number]["name"];
export type AccentName = (typeof accents)[number]["name"];

export const THEME_STORAGE_KEY = "jaba-theme";
export const ACCENT_STORAGE_KEY = "jaba-accent";

const theme = useStorage<ThemeName>(THEME_STORAGE_KEY, "dark");
const accent = useStorage<AccentName>(ACCENT_STORAGE_KEY, "red");

let applied = false;

export const useTheme = () => {
	const current = computed(() => themes.find(t => t.name === theme.value) ?? themes[0]);
	const currentAccent = computed(() => accents.find(a => a.name === accent.value) ?? accents[0]);

	if (!applied) {
		applied = true;

		watchEffect(() => {
			const root = document.documentElement;
			root.dataset.theme = current.value.name;
			root.dataset.accent = currentAccent.value.name;
			root.classList.toggle("dark", current.value.dark);
		});
	}

	return { theme, accent, current, currentAccent, isDark: computed(() => current.value.dark) };
};
