import { getMe } from "@/api";
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed } from "vue";

export const ME_QUERY_KEY = ["me"] as const;

export const useAuth = () => {
	const query = useQuery({
		queryKey: ME_QUERY_KEY,
		queryFn: getMe,
		staleTime: 60_000,
	});

	const me = computed(() => query.data.value ?? null);

	return {
		me,
		isLoggedIn: computed(() => Boolean(me.value)),
		isOwner: computed(() => Boolean(me.value?.owner)),
		isLoading: query.isLoading,
	};
};

/** Invalidates the cached session, e.g. after the key was regenerated */
export const useRefreshAuth = () => {
	const client = useQueryClient();
	return () => client.invalidateQueries({ queryKey: ME_QUERY_KEY });
};
