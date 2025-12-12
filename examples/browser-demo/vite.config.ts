import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      // Map evg imports to the source files for hot reloading during development
      evg: path.resolve(__dirname, "../../src"),
      "evg/core": path.resolve(__dirname, "../../src/core"),
      "evg/renderers": path.resolve(__dirname, "../../src/renderers"),
      "evg/serializers": path.resolve(__dirname, "../../src/serializers"),
      "evg/providers": path.resolve(__dirname, "../../src/providers"),
      "evg/environment": path.resolve(__dirname, "../../src/environment"),
      "evg/layout": path.resolve(__dirname, "../../src/layout"),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
