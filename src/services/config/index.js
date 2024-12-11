import fs from "fs";
import { CONFIG_PATH } from "../../constants/index.js";
import logger from "../../helpers/logger.js";

class ConfigService {
	constructor() {
		this.config = this.#loadConfig();
	}

	/**
	 *
	 * @param {string} key - key of the config
	 * @returns {*} - value of the config
	 */
	get(key) {
		const keys = key.split(".");
		return keys.reduce((config, k) => (config && config[k] !== undefined ? config[k] : undefined), this.config);
	}

	/**
	 * Set a config value.
	 * @param {string} key - key of the config to set
	 * @param {*} value - value to set
	 */
	set(key, value) {
		const keys = key.split(".");
		keys.reduce((config, k, i) => {
			if (i === keys.length - 1) {
				config[k] = value;
			} else {
				config[k] = config[k] || {};
			}
			return config[k];
		}, this.config);
		this.#saveConfig();
	}

	/**
	 * Load the config from the file.
	 * @returns {Config} - loaded config
	 */
	#loadConfig() {
		if (fs.existsSync(CONFIG_PATH)) {
			return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
		} else {
			logger.error("Config file not found");
			process.exit(1);
		}
	}

	/**
	 * Save the config to the file.
	 */
	#saveConfig() {
		try {
			fs.writeFileSync(CONFIG_PATH, JSON.stringify(this.config, null, 4), "utf-8");
		} catch (e) {
			logger.error("Failed to save config: ", e);
		}
	}
}

export default ConfigService;
