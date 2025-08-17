import fs from "fs";
import { CONFIG_PATH } from "@/constants/index.js";
import logger from "@/helpers/logger.js";

class ConfigService {
	private config = this.loadConfig();

	get<T>(key: string): T {
		if (key.startsWith("_comment")) throw new Error("Can't use comments as an argument");

		const keys = key.split(".");
		return keys.reduce(
			(config, k) => (config && config[k] !== undefined ? config[k] : undefined),
			this.config,
		);
	}

	set(key: string, value: unknown) {
		if (key.startsWith("_comment")) throw new Error("Can't use comments as an argument");

		const keys = key.split(".");
		keys.reduce((config, k, i) => {
			if (i === keys.length - 1) {
				config[k] = value;
			} else {
				config[k] = config[k] || {};
			}
			return config[k];
		}, this.config);
		this.saveConfig();
	}

	private loadConfig() {
		if (fs.existsSync(CONFIG_PATH)) {
			return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
		} else {
			logger.error("Config file not found");
			process.exit(1);
		}
	}

	private saveConfig() {
		try {
			fs.writeFileSync(CONFIG_PATH, JSON.stringify(this.config, null, 4), "utf-8");
		} catch (e) {
			logger.error("Failed to save config: ", e);
		}
	}
}

export default ConfigService;
