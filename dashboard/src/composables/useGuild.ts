import { getGuild } from "@/api";
import { useQuery } from "@tanstack/vue-query";
import { computed } from "vue";
import { useRoute } from "vue-router";

export const useGuildId = () => {
	const route = useRoute();
	return computed(() => String(route.params.id));
};

export const useGuild = () => {
	const id = useGuildId();
	const query = useQuery({ queryKey: ["guild", id], queryFn: () => getGuild(id.value) });

	return { id, ...query };
};
