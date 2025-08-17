import fs from "node:fs/promises";
import path from "node:path";
import { PROJECT_ROOT } from "@/constants/index.js";

export const getFilePaths = async (directory: string, nesting: boolean) => {
	let filePaths: string[] = [];

	const absoluteDirectory = path.isAbsolute(directory)
		? directory
		: path.join(PROJECT_ROOT, directory);
	const files = await fs.readdir(absoluteDirectory, { withFileTypes: true });

	for (const file of files) {
		const filePath = path.join(directory, file.name);

		if (file.isFile()) filePaths.push(filePath);

		if (nesting && file.isDirectory()) {
			const nestedFiles = await getFilePaths(filePath, true);
			filePaths = [...filePaths, ...nestedFiles];
		}
	}

	return filePaths;
};
