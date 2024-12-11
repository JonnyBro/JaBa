import path from "node:path";

export const PROJECT_ROOT = path.join(import.meta.dirname, "..");
export const CONFIG_PATH = path.join(PROJECT_ROOT, "..", "config.json");
