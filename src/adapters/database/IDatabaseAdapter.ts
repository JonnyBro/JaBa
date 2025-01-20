export default abstract class IDatabaseAdapter<ModelType, QueryType, UpdateType, OptionsType> {
	abstract connect(): Promise<void>;
	abstract disconnect(): Promise<void>;
	abstract find(_model: ModelType, _query?: QueryType, _options?: OptionsType): Promise<unknown[]>;
	abstract findOne(_model: ModelType, _query?: QueryType, _options?: OptionsType): Promise<unknown | null>;
	abstract updateOne(_model: ModelType, _filter: QueryType, _update: UpdateType, _options?: OptionsType): Promise<unknown>;
	abstract deleteOne(_model: ModelType, _filter: QueryType): Promise<unknown>;
	abstract findOneOrCreate(_model: ModelType, _filter: QueryType): Promise<unknown>;
}
