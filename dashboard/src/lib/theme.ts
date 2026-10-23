import { useStorage } from "@vueuse/core";
import { computed, watchEffect } from "vue";

/**
 * Keep in sync with src/assets/css/themes.css and the inline script in index.html.
 * `colors` are only used for the preview in the theme picker: background, panel, highlight
 */
export const themes = [
	{ name: "dark", label: "Dark", dark: true, colors: ["rgb(17 18 23)", "rgb(38 39 49)", "rgb(150 122 255)"] },
	{ name: "light", label: "Light", dark: false, colors: ["rgb(246 246 250)", "rgb(224 224 234)", "rgb(104 70 240)"] },
	{ name: "amoled", label: "AMOLED", dark: true, colors: ["rgb(0 0 0)", "rgb(26 26 32)", "rgb(150 122 255)"] },
] as const;

export type ThemeName = (typeof themes)[number]["name"];

export const THEME_STORAGE_KEY = "jaba-theme";

const theme = useStorage<ThemeName>(THEME_STORAGE_KEY, "dark");

let applied = false;

export const useTheme = () => {
	const current = computed(() => themes.find(t => t.name === theme.value) ?? themes[0]);

	if (!applied) {
		applied = true;

		watchEffect(() => {
			const root = document.documentElement;
			root.dataset.theme = current.value.name;
			root.classList.toggle("dark", current.value.dark);
		});
	}

	return { theme, current, isDark: computed(() => current.value.dark) };
};
