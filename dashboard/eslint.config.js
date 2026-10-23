import skipFormatting from "@vue/eslint-config-prettier/skip-formatting";
import { defineConfigWithVueTs, vueTsConfigs } from "@vue/eslint-config-typescript";
import pluginVue from "eslint-plugin-vue";
import { globalIgnores } from "eslint/config";

export default defineConfigWithVueTs(
	globalIgnores(["node_modules", "dist", "**/*.config.{js,ts,mjs,cjs,json}"]),
	{
		files: ["**/*.{ts,mts,tsx,vue}"],
		name: "Files to lint Vue",
	},
	pluginVue.configs["flat/essential"],
	vueTsConfigs.recommendedTypeChecked,
	{
		languageOptions: {
			parserOptions: {
				projectService: true,
			},
		},
	},
	skipFormatting,
	{
		files: ["**/*.vue"],
		rules: {
			"vue/multi-word-component-names": "off",
		},
	},
);
