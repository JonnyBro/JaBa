import i18next from "i18next";
import Backend from "i18next-fs-backend";
import fs from "fs/promises";
import { resolve, join } from "path";
import logger from "../../helpers/logger.js";
import supportedLanguages from "./language-meta.js";

export default class InternationalizationService {
	/**
	 * Constructs an instance of the InternationalizationService.
	 *
	 * @param {import("../../structures/client").ExtendedClient} client - The client instance.
	 * @param {Object} [options={}] - Optional configuration options.
	 */
	constructor(client, options = {}) {
		this.client = client;
		this.options = {
			localesPath: resolve(this.client.configService.get("paths.locales")),
			defaultLanguage: options.defaultLanguage || "en-US",
		};
		this.i18next = this.#init();
	}

	get getSupportedLanguages() {
		return supportedLanguages.map(lang => lang.locale);
	}

	async #walkDirectory(dir, namespaces = [], folderName = "") {
		const files = await fs.readdir(dir, { withFileTypes: true });

		const languages = [];
		for (const file of files) {
			if (file.isDirectory()) {
				const isLanguage = file.name.includes("-");
				if (isLanguage) languages.push(file.name);

				const folder = await this.#walkDirectory(join(dir, file.name), namespaces, isLanguage ? "" : `${file.name}/`);

				namespaces = folder.namespaces;
			} else {
				namespaces.push(`${folderName}${file.name.substr(0, file.name.length - 5)}`);
			}
		}
		return { namespaces: [...new Set(namespaces)], languages };
	}

	async #init() {
		const { namespaces, languages } = await this.#walkDirectory(this.options.localesPath);

		const i18n = await i18next.use(Backend).init({
			backend: {
				loadPath: resolve(this.options.localesPath, "./{{lng}}/{{ns}}.json"),
			},
			debug: this.client.configService.get("production") ? false : true,
			fallbackLng: this.options.defaultLanguage,
			interpolation: { escapeValue: false },
			load: "currentOnly",
			preload: languages,
			ns: namespaces,
			defaultNS: namespaces[0],
			initImmediate: false,
		});

		this.client.translate = (key, options = {}) => {
			const lng = options.lng || this.options.defaultLanguage;
			return i18next.t(key, { lng, ...options });
		};

		logger.log("Internationalization initialized");

		return i18n;
	}
}
