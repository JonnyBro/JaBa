import mongoose, { ConnectOptions, Document, Model, FilterQuery, QueryOptions, UpdateQuery } from "mongoose";
import IDatabaseAdapter from "./IDatabaseAdapter.js";
import logger from "@/helpers/logger.js";
import Cache from "../cache/MapCache.js";

export default class MongooseAdapter extends IDatabaseAdapter<Model<any>, FilterQuery<any>, UpdateQuery<any>, QueryOptions> {
	cache = new Cache();
	options: ConnectOptions;
	uri: string;

	constructor(uri: string, options: ConnectOptions = {}) {
		super();

		if (!uri) {
			throw new Error("MongooseAdapter: URI is required.");
		}
		this.options = options;
		this.uri = uri;
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

	#generateCacheKey(modelName: string, query: {}, options: {}) {
		return `${modelName}:${JSON.stringify(query)}:${JSON.stringify(options)}`;
	}

	async find<T extends Document>(model: Model<T>, query: FilterQuery<T>, options = {}): Promise<T[]> {
		const cacheKey = this.#generateCacheKey(model.modelName, query, options);
		if (this.cache.get(cacheKey)) {
			return this.cache.get(cacheKey);
		}

		const result = await model.find(query, null, options).exec();
		this.cache.set(cacheKey, result);
		return result;
	}

	async findOne<T extends Document>(model: Model<T>, query: FilterQuery<T>, options = {}): Promise<T | null> {
		const cacheKey = this.#generateCacheKey(model.modelName, query, options);
		if (this.cache.get(cacheKey)) {
			return this.cache.get(cacheKey);
		}

		const result = await model.findOne(query, null, options).exec();
		this.cache.set(cacheKey, result);
		return result;
	}

	async updateOne<T extends Document>(model: Model<T>, filter: FilterQuery<T>, update: UpdateQuery<T>, options = {}) {
		const result = await model.updateOne(filter, update, options).exec();
		this.cache.clear();
		return result;
	}

	async deleteOne<T extends Document>(model: Model<T>, filter: FilterQuery<T>) {
		const result = await model.deleteOne(filter).exec();
		this.cache.clear();
		return result;
	}

	async findOneOrCreate<T extends Document>(model: Model<T>, filter: FilterQuery<T>) {
		this.cache.clear();
		const result = await model.findOne(filter).then(result => {
			if (result) return result;

			return model.create(filter);
		});

		return result;
	}
}
