import { QueryClient } from "@tanstack/vue-query";
import { AxiosError } from "axios";

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 30_000,
			refetchOnWindowFocus: false,
			retry: (failureCount, error) => {
				const status = error instanceof AxiosError ? error.response?.status : undefined;
				if (status && status >= 400 && status < 500) return false;
				return failureCount < 2;
			},
		},
	},
});
