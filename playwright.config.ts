import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: true,
  use: { baseURL: "http://127.0.0.1:5174", ...devices["Desktop Chrome"] },
  webServer: {
    command:
      "node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5174 --strictPort --mode demo",
    url: "http://127.0.0.1:5174",
    reuseExistingServer: true,
  },
  reporter: "list",
});
