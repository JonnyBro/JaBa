import fs from "node:fs/promises";
import { resolve, join } from "node:path";

const SRC_DIR = resolve("./src/services/languages/locales");
const DIST_DIR = resolve("./dist/services/languages/locales");

async function copyLanguagesDir(src: string, dist: string) {
	await fs.mkdir(dist, { recursive: true });

	const entries = await fs.readdir(src, { withFileTypes: true });
	for (const entry of entries) {
		const srcPath = join(src, entry.name);
		const destPath = join(dist, entry.name);

		if (entry.isDirectory()) {
			await copyLanguagesDir(srcPath, destPath);
		} else {
			await fs.copyFile(srcPath, destPath);
		}
	}
}

copyLanguagesDir(SRC_DIR, DIST_DIR)
	.then(() => console.log("Done copy languages dir"))
	.catch(e => {
		console.error("Error copying languages:", e);
		process.exit(1);
	});
