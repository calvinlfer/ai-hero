import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  test: {
    setupFiles: ["dotenv/config"],
    testTimeout: 1000 * 60 * 8,
    maxConcurrency: 8
  },
  plugins: [tsconfigPaths()],
});
