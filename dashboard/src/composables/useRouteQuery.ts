import { computed, type WritableComputedRef } from "vue";
import { useRoute, useRouter } from "vue-router";

/** Two-way binding between a URL query parameter and a ref, so filters survive reloads and can be shared */
export function useRouteQuery(name: string, defaultValue: number): WritableComputedRef<number>;
export function useRouteQuery(name: string, defaultValue: string): WritableComputedRef<string>;
export function useRouteQuery(name: string, defaultValue: string | number) {
	const route = useRoute();
	const router = useRouter();

	return computed<string | number>({
		get: () => {
			const raw = route.query[name];
			const value = Array.isArray(raw) ? raw[0] : raw;
			if (value === undefined || value === null || value === "") return defaultValue;
			return typeof defaultValue === "number" ? Number(value) || defaultValue : value;
		},
		set: value => {
			const query = { ...route.query };
			if (value === defaultValue || value === "") delete query[name];
			else query[name] = String(value);
			void router.replace({ query });
		},
	});
}
