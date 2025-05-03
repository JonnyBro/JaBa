import {
	EntityName,
	EntityManager,
	MikroORM,
	RequiredEntityData,
	FilterQuery,
} from "@mikro-orm/mongodb";
import IDatabaseAdapter from "./IDatabaseAdapter.js";
import Cache from "../cache/MapCache.js";
import { MongoDriver } from "@mikro-orm/mongodb";
import mirkoOrmConfig from "./mirko-orm.config.js";
import logger from "@/helpers/logger.js";
import { BaseEntity } from "@/structures/BaseEntity.js";

export default class MikroOrmAdapter extends IDatabaseAdapter<
	EntityName<any>,
	Record<string, any>,
	FilterQuery<any>,
	unknown,
	any
> {
	cache = new Cache();
	em!: EntityManager;
	orm!: MikroORM;

	uri!: string;

	constructor(uri: string) {
		super();
		this.uri = uri;
	}

	async connect() {
		this.orm = await MikroORM.init<MongoDriver>({
			...mirkoOrmConfig,
			clientUrl: this.uri,
		});
		this.em = this.orm.em.fork();
		this.em.clear();

		BaseEntity.useEntityManager(this.em);

		logger.log("Database connected.");
	}

	async disconnect() {
		await this.orm.close(true);
		logger.warn("Database disconnected.");
		this.cache.clear();
	}

	#generateCacheKey(modelName: string, query: {}, options: {}) {
		return `${modelName}:${JSON.stringify(query)}:${JSON.stringify(options)}`;
	}

	async find<T extends object>(model: EntityName<T>, query: FilterQuery<T> = {}) {
		const cacheKey = this.#generateCacheKey(model.toString(), query, {});
		if (this.cache.get(cacheKey)) {
			return this.cache.get(cacheKey) as T[];
		}

		const result = await this.em.find(model, query);
		this.cache.set(cacheKey, result);
		return result;
	}

	async findOne<T extends object>(model: EntityName<T>, query: FilterQuery<T> = {}) {
		const cacheKey = this.#generateCacheKey(model.toString(), query, {});
		if (this.cache.get(cacheKey)) {
			return this.cache.get(cacheKey) as T[];
		}

		const result = await this.em.findOne(model, query);
		this.cache.set(cacheKey, result);

		return result;
	}

	async updateOne<T extends object>(model: EntityName<T>, filter: FilterQuery<T>, update: any) {
		const result = await this.em.nativeUpdate(model, filter, update);
		this.cache.clear();
		return result;
	}

	async deleteOne<T extends object>(model: EntityName<T>, filter: FilterQuery<T>) {
		const result = await this.em.nativeDelete(model, filter);
		this.cache.clear();
		return result;
	}

	async findOneOrCreate<T extends object>(model: EntityName<T>, filter: FilterQuery<T>) {
		this.cache.clear();
		const result = await this.em.findOne(model, filter).then(async entity => {
			if (entity) {
				return entity;
			}
			const res = this.em.create(model, filter as unknown as RequiredEntityData<T>);
			await this.em.persistAndFlush(res);
			return res;
		});
		return result;
	}
}
