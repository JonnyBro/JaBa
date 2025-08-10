import path from "node:path";
import { PROJECT_ROOT } from "@/constants/index.js";

export const toFileURL = (filePath: string) => {
	const resolvedPath = path.isAbsolute(filePath)
		? filePath
		: path.resolve(PROJECT_ROOT, filePath);
	return "file://" + resolvedPath.replace(/\\\\|\\/g, "/");
};
