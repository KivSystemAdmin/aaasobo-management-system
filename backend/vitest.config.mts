import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: "node",
    silent: false, // Keep test output visible
    logHeapUsage: false,
    testTimeout: 15000,
    include: ["src/test/**/*.test.ts"],
    globalSetup: ["./src/test/globalSetup.ts"],
    setupFiles: ["./src/test/setup.ts"],
    exclude: ["**/node_modules/**"],
    env: {
      NODE_ENV: "development",
      AUTH_SALT: "test-auth-salt",
      AUTH_SECRET: "test-auth-secret",
    },
    pool: "forks",
    // Suppress console output during tests for cleaner output
    onConsoleLog: (log, type) => {
      // Suppress error logs during tests but keep other logs
      if (type === "stderr" && log.includes("Error")) {
        return false;
      }
      return true;
    },
  },
});
