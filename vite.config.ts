import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      include: "**/*.tsx",
    }),
    tailwindcss(),
  ],
  test: {
    environment: "happy-dom",
    setupFiles: ["./src/tests/setup.ts"],
    include: ["src/**/*.{test}.{ts,tsx}"],
  },
  server: {
    hmr: true,
    watch: {
      usePolling: true,
    },
  },
});
