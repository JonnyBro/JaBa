import globals from "globals";
import pluginJs from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import stylistic from "@stylistic/eslint-plugin";
import tsPlugin from "@typescript-eslint/eslint-plugin";

/** @type {import("eslint").Linter.Config[]} */
export default [
	pluginJs.configs.recommended,
	{
		files: ["**/*.ts"],
		ignores: ["**/*.d.ts", "dist", "node_modules"],
		languageOptions: {
			globals: globals.node,
			ecmaVersion: "latest",
			sourceType: "module",
			parser: tsParser,
		},
		plugins: {
			"@typescript-eslint": tsPlugin,
			"@stylistic": stylistic,
		},
		rules: {
			"max-len": ["error", { code: 100, ignoreRegExpLiterals: true }],
			"no-unused-vars": "off",
			"@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }],
			"arrow-body-style": ["error", "as-needed"],
			camelcase: "error",
			curly: ["error", "multi-line"],
			eqeqeq: ["error", "always"],
			"no-console": "off",
			"no-var": "error",
			"prefer-const": "error",
			yoda: "error",
			"@stylistic/arrow-spacing": ["error", { before: true, after: true }],
			"@stylistic/comma-dangle": ["error", "always-multiline"],
			"@stylistic/comma-spacing": ["error", { before: false, after: true }],
			"@stylistic/comma-style": ["error", "last"],
			"@stylistic/dot-location": ["error", "property"],
			"@stylistic/keyword-spacing": ["error", { before: true, after: true }],
			"@stylistic/no-multi-spaces": "error",
			"@stylistic/no-multiple-empty-lines": [
				"error",
				{
					max: 2,
					maxEOF: 1,
					maxBOF: 0,
				},
			],
			"@stylistic/no-trailing-spaces": ["error"],
			"@stylistic/object-curly-spacing": ["error", "always"],
			"@stylistic/quotes": ["error", "double"],
			"@stylistic/indent": ["error", "tab"],
			"@stylistic/semi": ["error", "always"],
			"@stylistic/space-infix-ops": "error",
		},
	},
];
