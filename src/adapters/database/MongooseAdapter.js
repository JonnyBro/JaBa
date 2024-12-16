import mongoose from "mongoose";
import IDatabaseAdapter from "./IDatabaseAdapter.js";
import logger from "../../helpers/logger.js";
import Cache from "../cache/MapCache.js";

export default class MongooseAdapter extends IDatabaseAdapter {
	/**
	 *
	 * @param {string} uri - database url connect
	 * @param {mongoose.ConnectOptions} options - database connect options
	 */
	constructor(uri, options = {}) {
		super();

		if (!uri) {
			throw new Error("MongooseAdapter: URI is required.");
		}

		this.uri = uri;
		this.options = options;
		this.cache = new Cache();
	}

	async connect() {
		await mongoose.connect(this.uri, this.options);
		logger.log("Database connected.");
	}

	async disconnect() {
		await mongoose.disconnect();
		logger.warn("Database disconnected.");
		this.cache.clear();
	}

	#generateCacheKey(modelName, query, options) {
		return `${modelName}:${JSON.stringify(query)}:${JSON.stringify(options)}`;
	}

	async find(model, query = {}, options = {}) {
		const cacheKey = this.#generateCacheKey(model.modelName, query, options);
		if (this.cache.get(cacheKey)) {
			return this.cache.get(cacheKey);
		}

		const result = await model.find(query, null, options).exec();
		this.cache.set(cacheKey, result);
		return result;
	}

	async findOne(model, query = {}, options = {}) {
		const cacheKey = this.#generateCacheKey(model.modelName, query, options);
		if (this.cache.get(cacheKey)) {
			return this.cache.get(cacheKey);
		}

		const result = await model.findOne(query, null, options).exec();
		this.cache.set(cacheKey, result);
		return result;
	}

	async updateOne(model, filter, update, options = {}) {
		const result = await model.updateOne(filter, update, options).exec();
		this.cache.clear();
		return result;
	}

	async deleteOne(model, filter) {
		const result = await model.deleteOne(filter).exec();
		this.cache.clear();
		return result;
	}
}
