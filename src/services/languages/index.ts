import i18next, { TOptionsBase } from "i18next";
import Backend from "i18next-fs-backend";
import fs from "fs/promises";
import { resolve, join } from "path";
import logger from "@/helpers/logger.js";
import supportedLanguages from "./language-meta.js";
import { ExtendedClient } from "@/structures/client.js";

interface InternationalizationServiceOptions {
	defaultLanguage?: string;
}

interface WalkDirectoryResult {
	namespaces: string[];
	languages: string[];
}

export default class InternationalizationService {
	private client: ExtendedClient;
	private options: {
		localesPath: string;
		defaultLanguage: string;
	};

	constructor(client: ExtendedClient, options: InternationalizationServiceOptions = {}) {
		this.client = client;
		this.options = {
			localesPath: resolve(this.client.configService.get("paths.locales")),
			defaultLanguage: options.defaultLanguage || this.client.configService.get("defaultLang"),
		};
		this.init();
	}

	get getSupportedLanguages(): string[] {
		return supportedLanguages.map(lang => lang.locale);
	}

	private async walkDirectory(dir: string, namespaces: string[] = [], folderName: string = ""): Promise<WalkDirectoryResult> {
		const files = await fs.readdir(dir, { withFileTypes: true });

		const languages: string[] = [];
		for (const file of files) {
			if (file.isDirectory()) {
				const isLanguage = file.name.includes("-");
				if (isLanguage) languages.push(file.name);

				const folder = await this.walkDirectory(join(dir, file.name), namespaces, isLanguage ? "" : `${file.name}/`);

				namespaces = folder.namespaces;
			} else {
				namespaces.push(`${folderName}${file.name.substr(0, file.name.length - 5)}`);
			}
		}
		return { namespaces: [...new Set(namespaces)], languages };
	}

	public translate(
		key: string,
		options?:
			| TOptionsBase
			| {
					[key: string]: string;
			  },
	) {
		const lng = options?.lng || this.options.defaultLanguage;
		return i18next.t(key, { lng, ...options });
	}

	private async init() {
		const { namespaces, languages } = await this.walkDirectory(this.options.localesPath);

		const i18nInstance = await i18next.use(Backend).init({
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

		logger.log("Internationalization initialized");

		return i18nInstance;
	}
}
