import globals from "globals";
import pluginJs from "@eslint/js";
import prettierRecommended from "eslint-plugin-prettier/recommended";

export default [
    pluginJs.configs.recommended,
    prettierRecommended,
    {
        ignores: ["Build/", "Packages/", "**/Public/", "**/Resources/Private/Templates/", "*.noLinter.*"],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                FLOW: "readonly",
            },
        },
    },
];
