import fs from "node:fs/promises";
import path from "node:path";

export const getFilePaths = async (directory, nesting) => {
	let filePaths = [];

	if (!directory) return;

	const files = await fs.readdir(directory, { withFileTypes: true });

	for (const file of files) {
		const filePath = path.join(directory, file.name);

		if (file.isFile()) {
			filePaths.push(filePath);
		}

		if (nesting && file.isDirectory()) {
			filePaths = [...filePaths, ...(await getFilePaths(filePath, true))];
		}
	}

	return filePaths;
};
