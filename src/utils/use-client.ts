import { SUPER_CONTEXT } from "@/constants/index.js";

export default function useClient() {
	const store = SUPER_CONTEXT.getStore();
	if (!store) {
		throw new Error("Client is not initialized. Please initialize it first.");
	}
	return store;
}
