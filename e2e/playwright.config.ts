import { defineConfig } from "@playwright/test";

const baseURL = process.env.BASE_URL ?? "http://host.docker.internal:3000";
const target = new URL(baseURL);

if (target.hostname !== "host.docker.internal") {
  throw new Error(
    `Refusing to run against ${target.hostname}. The advance-schedule scenario only accepts the local Docker host.`,
  );
}

if (!process.env.USERNAME || !process.env.PASSWORD) {
  throw new Error("USERNAME and PASSWORD are required for admin Basic Auth.");
}

export default defineConfig({
  testDir: "./tests",
  timeout: 30 * 60 * 1000,
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  outputDir: "/tmp/test-results",
  reporter: "line",
  use: {
    baseURL,
    actionTimeout: 15_000,
    navigationTimeout: 15_000,
    httpCredentials: {
      username: process.env.USERNAME,
      password: process.env.PASSWORD,
    },
    headless: true,
    screenshot: "off",
    trace: "off",
    video: "off",
  },
});
