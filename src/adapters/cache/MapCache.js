import ICacheAdapter from "./ICacheAdapter.js";

export default class MapCache extends ICacheAdapter {
	constructor() {
		super();
		this.store = new Map();
	}

	get(key) {
		return this.store.get(key);
	}

	set(key, value) {
		this.store.set(key, value);
	}

	clear() {
		this.store.clear();
	}

	delete(key) {
		this.store.delete(key);
	}
}
