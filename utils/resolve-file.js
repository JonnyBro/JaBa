import path from "node:path";

/**
 * Convert a local file path to a file URL.
 * @param {string} filePath - local file's path.
 * @returns {string} file URL
 */
export const toFileURL = filePath => {
	const resolvedPath = path.resolve(filePath);
	return "file://" + resolvedPath.replace(/\\\\|\\/g, "/");
};
