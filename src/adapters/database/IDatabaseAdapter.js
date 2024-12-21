export default class IDatabaseAdapter {
	async connect() {
		throw new Error("Method `connect` not implemented.");
	}

	async disconnect() {
		throw new Error("Method `disconnect` not implemented.");
	}

	async find() {
		throw new Error("Method \"find\" must be implemented");
	}

	async findOne() {
		throw new Error("Method \"findOne\" must be implemented");
	}

	async updateOne() {
		throw new Error("Method \"updateOne\" must be implemented");
	}

	async deleteOne() {
		throw new Error("Method \"deleteOne\" must be implemented");
	}
}
