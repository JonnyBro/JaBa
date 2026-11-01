import { PROJECT_ROOT } from "@/constants/index.js";
import path from "node:path";

export const toFileURL = (filePath: string) => {
	const resolvedPath = path.isAbsolute(filePath) ? filePath : path.resolve(PROJECT_ROOT, filePath);
	return "file://" + resolvedPath.replace(/\\\\|\\/g, "/");
};
