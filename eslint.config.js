import globals from "globals";
import pluginJs from "@eslint/js";
import stylisticJs from "@stylistic/eslint-plugin-js";

/** @type {import("eslint").Linter.Config[]} */
export default [
	pluginJs.configs.recommended,
	{
		languageOptions: {
			globals: globals.node,
			ecmaVersion: "latest",
			sourceType: "module",
		},
		ignores: ["node_modules", "dashboard"],
		plugins: {
			"@stylistic/js": stylisticJs,
		},
		rules: {
			"arrow-body-style": ["error", "as-needed"],
			camelcase: "error",
			curly: ["error", "multi-line"],
			eqeqeq: ["error", "always"],
			"no-console": "off",
			"no-var": "error",
			"prefer-const": "error",
			yoda: "error",
			"@stylistic/js/arrow-spacing": ["error", { before: true, after: true }],
			"@stylistic/js/comma-dangle": ["error", "always-multiline"],
			"@stylistic/js/comma-spacing": ["error", { before: false, after: true }],
			"@stylistic/js/comma-style": ["error", "last"],
			"@stylistic/js/dot-location": ["error", "property"],
			"@stylistic/js/keyword-spacing": ["error", { before: true, after: true }],
			"@stylistic/js/no-multi-spaces": "error",
			"@stylistic/js/no-multiple-empty-lines": [
				"error",
				{
					max: 2,
					maxEOF: 1,
					maxBOF: 0,
				},
			],
			"@stylistic/js/no-trailing-spaces": ["error"],
			"@stylistic/js/object-curly-spacing": ["error", "always"],
			"@stylistic/js/quotes": ["error", "double"],
			"@stylistic/js/indent": ["error", "tab"],
			"@stylistic/js/semi": ["error", "always"],
			"@stylistic/js/space-infix-ops": "error",
		},
	},
];
