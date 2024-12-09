import mongoose from "mongoose";
import IDatabaseAdapter from "./IDatabaseAdapter.js";

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
	}

	async connect() {
		await mongoose.connect(this.uri, this.options);
		console.log("Database connected.");
	}

	async disconnect() {
		await mongoose.disconnect();
		console.log("Database disconnected.");
	}
}
