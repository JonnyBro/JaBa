import Cache from "@/adapters/cache/MapCache.js";
import logger from "@/helpers/logger.js";
import mongoose, { ConnectOptions, QueryFilter, HydratedDocument, Model, QueryOptions, UpdateQuery } from "mongoose";
import IDatabaseAdapter from "./IDatabaseAdapter.js";

export default class MongooseAdapter extends IDatabaseAdapter<
	Model<any>,
	QueryFilter<any>,
	UpdateQuery<any>,
	QueryOptions,
	any
> {
	cache = new Cache();
	options: ConnectOptions;
	uri: string;

	constructor(uri: string, options: ConnectOptions = {}) {
		super();

		if (!uri) throw new Error("MongooseAdapter: URI is required");
		this.options = options;
		this.uri = uri;
	}

	async connect() {
		await mongoose.connect(this.uri, this.options);
		logger.info("Database connected");
	}

	async disconnect() {
		await mongoose.disconnect();
		logger.warn("Database disconnected");
		this.cache.clear();
	}

	#generateCacheKey(modelName: string, query: {}, options: {}) {
		return `${modelName}:${JSON.stringify(query)}:${JSON.stringify(options)}`;
	}

	async find<TSchema extends {}, TDoc extends HydratedDocument<TSchema> = HydratedDocument<TSchema>>(
		model: Model<TSchema>,
		query: QueryFilter<TSchema> = {},
		options: QueryOptions = {},
	): Promise<TDoc[]> {
		const cacheKey = this.#generateCacheKey(model.modelName, query, {
			runValidators: true,
			...options,
		});
		if (this.cache.get(cacheKey)) return this.cache.get(cacheKey);

		const result = await model.find(query, null, { runValidators: true, ...options }).exec();
		this.cache.set(cacheKey, result);
		return result as TDoc[];
	}

	async findOne<TSchema extends {}, TDoc extends HydratedDocument<TSchema> = HydratedDocument<TSchema>>(
		model: Model<TSchema>,
		query: QueryFilter<TSchema> = {},
		options: QueryOptions = {},
	): Promise<TDoc | null> {
		const cacheKey = this.#generateCacheKey(model.modelName, query, {
			runValidators: true,
			...options,
		});
		if (this.cache.get(cacheKey)) return this.cache.get(cacheKey);

		const result = await model.findOne(query, null, { runValidators: true, ...options }).exec();
		this.cache.set(cacheKey, result);
		return result as TDoc;
	}

	async updateOne<TSchema extends {}>(
		model: Model<TSchema>,
		filter: QueryFilter<TSchema>,
		update: UpdateQuery<TSchema>,
		options = {},
	) {
		const result = await model.updateOne(filter, update, { runValidators: true, ...options }).exec();
		this.cache.clear();
		return result;
	}

	async deleteOne<TSchema extends {}>(model: Model<TSchema>, filter: QueryFilter<TSchema>) {
		const result = await model.deleteOne(filter).exec();
		this.cache.clear();
		return result;
	}

	async findOneOrCreate<TSchema extends {}, TDoc extends HydratedDocument<TSchema> = HydratedDocument<TSchema>>(
		model: Model<TSchema>,
		filter: QueryFilter<TSchema>,
	): Promise<TDoc> {
		this.cache.clear();

		const existing = await model.findOne(filter);
		if (existing) return existing as TDoc;

		try {
			// Callers only pass plain equality filters like { id, guildID }, so the filter is also the new document
			return (await model.create(filter as Partial<TSchema>)) as unknown as TDoc;
		} catch (error) {
			// A parallel call created the same document first, the unique index rejected ours
			if ((error as { code?: number }).code !== 11000) throw error;

			return (await model.findOne(filter)) as TDoc;
		}
	}
}
