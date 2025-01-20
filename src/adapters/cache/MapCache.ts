import ICacheAdapter from "./ICacheAdapter.js";

export default class MapCache extends ICacheAdapter {
	store = new Map();
	constructor() {
		super();
	}

	get(key: string) {
		return this.store.get(key);
	}

	set<T>(key: string, value: T) {
		this.store.set(key, value);
	}

	clear() {
		this.store.clear();
	}

	delete(key: string) {
		this.store.delete(key);
	}
}
