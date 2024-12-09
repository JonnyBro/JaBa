import path from "node:path";
import { PROJECT_ROOT } from "../constants/index.js";

/**
 * Convert a local file path to a file URL.
 * @param {string} filePath - local file's path.
 * @returns {string} file URL
 */
export const toFileURL = filePath => {
	const resolvedPath = path.isAbsolute(filePath) ? filePath : path.resolve(PROJECT_ROOT, filePath);
	return "file://" + resolvedPath.replace(/\\\\|\\/g, "/");
};
