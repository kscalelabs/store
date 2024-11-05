import { fixupConfigRules } from "@eslint/compat";
import pluginJs from "@eslint/js";
import pluginReactConfig from "eslint-plugin-react/configs/recommended.js";
import tseslint from "typescript-eslint";

const reactSettings = {
  settings: {
    react: {
      version: "detect", // Automatically detect the React version
    },
  },
};

export default [
  {
    ignores: [
      "node_modules/**/*",
      "**/__tests__/**/*",
      "*.config.ts",
      "*.config.js",
      "src/lib/mujoco/**/*",
      "src/lib/klang/**/*",
    ],
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  reactSettings,
  ...fixupConfigRules({
    ...pluginReactConfig,
    rules: {
      ...pluginReactConfig.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
    },
  }),
];
