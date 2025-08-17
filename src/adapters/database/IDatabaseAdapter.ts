export default abstract class IDatabaseAdapter<
	ModelType,
	QueryType,
	UpdateType,
	OptionsType,
	DocType,
> {
	abstract connect(): Promise<void>;
	abstract disconnect(): Promise<void>;

	abstract find(model: ModelType, query?: QueryType, options?: OptionsType): Promise<DocType[]>;

	abstract findOne(
		model: ModelType,
		query?: QueryType,
		options?: OptionsType,
	): Promise<DocType | null>;

	abstract updateOne(
		model: ModelType,
		filter: QueryType,
		update: UpdateType,
		options?: OptionsType,
	): Promise<unknown>;

	abstract deleteOne(model: ModelType, filter: QueryType): Promise<unknown>;

	abstract findOneOrCreate(model: ModelType, filter: QueryType): Promise<DocType>;
}
