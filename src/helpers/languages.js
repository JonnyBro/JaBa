import { use, init, getFixedT } from "i18next";
import Backend from "i18next-fs-backend";
import { join, resolve } from "path";
import { promises as fs } from "fs";

async function walkDirectory(dir, namespaces = [], folderName = "") {
	const files = await fs.readdir(dir);

	const languages = [];
	for (const file of files) {
		const stat = await fs.stat(join(dir, file));
		if (stat.isDirectory()) {
			const isLanguage = file.includes("-");
			if (isLanguage) languages.push(file);

			const folder = await walkDirectory(join(dir, file), namespaces, isLanguage ? "" : `${file}/`);

			namespaces = folder.namespaces;
		} else {
			namespaces.push(`${folderName}${file.substr(0, file.length - 5)}`);
		}
	}

	return {
		namespaces: [...new Set(namespaces)],
		languages,
	};
}

export default async () => {
	const options = {
		loadPath: resolve(__dirname, "../languages/{{lng}}/{{ns}}.json"),
	};

	const { namespaces, languages } = await walkDirectory(resolve(__dirname, "../languages/"));

	use(Backend);

	await init({
		backend: options,
		debug: false,
		fallbackLng: "en-US",
		initImmediate: false,
		interpolation: { escapeValue: false },
		load: "all",
		ns: namespaces,
		preload: languages,
	});

	return new Map(languages.map(item => [item, getFixedT(item)]));
};
