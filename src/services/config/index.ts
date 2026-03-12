import logger from "@/helpers/logger.js";
import env from "dotenv";

class ConfigService {
	loadConfig() {
		const out = env.config({
			quiet: true,
		});

		if (out.error) {
			logger.error("Error loading .env file:", out.error);
			return process.exit(1);
		}

		return this;
	}

	get<T>(key: string): T {
		return process.env[key] as T;
	}
}

export default ConfigService;
