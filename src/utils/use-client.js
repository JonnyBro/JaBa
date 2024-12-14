import { SUPER_CONTEXT } from "../constants/index.js";

/**
 * Returns the instance of the client.
 *
 * @throws {Error} Client is not initialized. Please initialize it first.
 *
 * @returns {import("../structures/client.js").ExtendedClient} The client instance.
 */
export default function useClient() {
	const store = SUPER_CONTEXT.getStore();
	if (!store) {
		throw new Error("Client is not initialized. Please initialize it first.");
	}
	return store;
}
