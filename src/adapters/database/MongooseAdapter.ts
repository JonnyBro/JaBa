import mongoose, {
	ConnectOptions,
	Model,
	FilterQuery,
	QueryOptions,
	UpdateQuery,
	HydratedDocument,
} from "mongoose";
import IDatabaseAdapter from "./IDatabaseAdapter.js";
import logger from "@/helpers/logger.js";
import Cache from "../cache/MapCache.js";

export default class MongooseAdapter extends IDatabaseAdapter<
	Model<any>,
	FilterQuery<any>,
	UpdateQuery<any>,
	QueryOptions,
	any
> {
	cache = new Cache();
	options: ConnectOptions;
	uri: string;

	constructor(uri: string, options: ConnectOptions = {}) {
		super();
		if (!uri) throw new Error("MongooseAdapter: URI is required.");
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

	async find<
		TSchema extends {},
		TDoc extends HydratedDocument<TSchema> = HydratedDocument<TSchema>,
	>(
		model: Model<TSchema>,
		query: FilterQuery<TSchema> = {},
		options: QueryOptions = {},
	): Promise<TDoc[]> {
		const cacheKey = this.#generateCacheKey(model.modelName, query, options);
		if (this.cache.get(cacheKey)) {
			return this.cache.get(cacheKey);
		}

		const result = await model.find(query, null, options).exec();
		this.cache.set(cacheKey, result);
		return result as TDoc[];
	}

	async findOne<
		TSchema extends {},
		TDoc extends HydratedDocument<TSchema> = HydratedDocument<TSchema>,
	>(
		model: Model<TSchema>,
		query: FilterQuery<TSchema> = {},
		options: QueryOptions = {},
	): Promise<TDoc | null> {
		const cacheKey = this.#generateCacheKey(model.modelName, query, options);
		if (this.cache.get(cacheKey)) {
			return this.cache.get(cacheKey);
		}

		const result = await model.findOne(query, null, options).exec();
		this.cache.set(cacheKey, result);
		return result as TDoc;
	}

	async updateOne<TSchema extends {}>(
		model: Model<TSchema>,
		filter: FilterQuery<TSchema>,
		update: UpdateQuery<TSchema>,
		options = {},
	) {
		const result = await model.updateOne(filter, update, options).exec();
		this.cache.clear();
		return result;
	}

	async deleteOne<TSchema extends {}>(model: Model<TSchema>, filter: FilterQuery<TSchema>) {
		const result = await model.deleteOne(filter).exec();
		this.cache.clear();
		return result;
	}

	async findOneOrCreate<
		TSchema extends {},
		TDoc extends HydratedDocument<TSchema> = HydratedDocument<TSchema>,
	>(model: Model<TSchema>, filter: FilterQuery<TSchema>): Promise<TDoc> {
		this.cache.clear();
		const result = await model.findOne(filter).then(result => {
			if (result) return result as TDoc;
			return model.create(filter) as unknown as TDoc;
		});
		return result;
	}
}
