import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: [
      "node_modules/**",
      "public/**/css/output.css",
    ],
  },

  js.configs.recommended,

  // Código del servidor: archivos .js en Node.js
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
  },

  // Código que se ejecuta en el navegador
  {
    files: ["public/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.browser,
        // Utilidad de búsqueda compartida (public/admin/js/busqueda.js)
        Busqueda: "readonly",
      },
    },
  },

  // Configuración CommonJS de Sequelize CLI
  {
    files: ["**/*.cjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        ...globals.node,
      },
    },
  },
];