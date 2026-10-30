import { createI18n } from "vue-i18n";
import { computed, ref, watchEffect } from "vue";
import en from "@/locales/en.json";

/**
 * Every JSON file in src/locales is a language. To add one, copy en.json to <code>.json
 * (e.g. de.json or pt-BR.json), translate the values and set "meta.name" to the language's own name.
 * Missing keys fall back to English.
 */
export type MessageSchema = typeof en;

const modules = import.meta.glob<MessageSchema>("../locales/*.json", { eager: true, import: "default" });

const messages = Object.fromEntries(
	Object.entries(modules).map(([path, data]) => [path.replace(/^.*\/(.+)\.json$/, "$1"), data]),
);

export const FALLBACK_LOCALE = "en";
const STORAGE_KEY = "jaba-locale";

export const locales = Object.entries(messages)
	.map(([code, data]) => ({ code, name: data.meta?.name ?? code }))
	.sort((a, b) => a.name.localeCompare(b.name));

const findLocale = (wanted: string) => {
	const lower = wanted.toLowerCase();
	return (
		locales.find(l => l.code.toLowerCase() === lower)?.code ??
		locales.find(l => l.code.toLowerCase() === lower.split("-")[0])?.code
	);
};

const readSaved = () => {
	try {
		return localStorage.getItem(STORAGE_KEY);
	} catch {
		return null;
	}
};

export const detectBrowserLocale = () => {
	for (const lang of navigator.languages ?? [navigator.language]) {
		const found = findLocale(lang);
		if (found) return found;
	}
	return FALLBACK_LOCALE;
};

/**
 * Plural forms are listed in CLDR order (zero | one | two | few | many | other), skipping the ones the language
 * doesn't have. "other" can be left out when it's only used for fractions, e.g. Russian uses one | few | many.
 */
const categoryOrder = ["zero", "one", "two", "few", "many", "other"];

const pluralRule = (locale: string) => {
	const rules = new Intl.PluralRules(locale);
	const categories = categoryOrder.filter(c =>
		rules.resolvedOptions().pluralCategories.includes(c as Intl.LDMLPluralRule),
	);

	return (choice: number, choicesLength: number) => {
		const index = categories.indexOf(rules.select(Math.abs(choice)));
		return Math.min(index === -1 ? choicesLength - 1 : index, choicesLength - 1);
	};
};

const saved = readSaved();

export const i18n = createI18n({
	legacy: false,
	locale: (saved && findLocale(saved)) || detectBrowserLocale(),
	fallbackLocale: FALLBACK_LOCALE,
	messages: messages,
	pluralRules: Object.fromEntries(locales.map(l => [l.code, pluralRule(l.code)])),
	missingWarn: import.meta.env.DEV,
	fallbackWarn: false,
});

export const currentLocale = computed(() => i18n.global.locale.value);

export const isAutoLocale = ref(!(saved && findLocale(saved)));

export const setLocale = (code: string | null) => {
	try {
		if (code) localStorage.setItem(STORAGE_KEY, code);
		else localStorage.removeItem(STORAGE_KEY);
	} catch {
		// Private mode, the choice just won't be remembered
	}

	isAutoLocale.value = !code;
	i18n.global.locale.value = code ? (findLocale(code) ?? FALLBACK_LOCALE) : detectBrowserLocale();
};

watchEffect(() => {
	document.documentElement.lang = i18n.global.locale.value;
});
