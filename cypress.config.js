import { defineConfig } from "cypress";
import dotenv from "dotenv";
import path from "path";

export default defineConfig({
  video: false,
  screenshotOnRunFailure: true,
  defaultCommandTimeout: 12000,
  requestTimeout: 12000,
  responseTimeout: 12000,
  retries: {
    runMode: 1,
    openMode: 0
  },
  e2e: {
    setupNodeEvents(on, config) {
      // Load ./software-testing/.env into Cypress env
      dotenv.config({ path: path.resolve(process.cwd(), ".env") });
      config.env.ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim();
      config.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
      return config;
    },
    baseUrl: process.env.CYPRESS_BASE_URL || "https://haus9.samparka.co",
    specPattern: "cypress/e2e/**/*.cy.js",
    supportFile: "cypress/support/e2e.js",
    fixturesFolder: "cypress/fixtures",
    chromeWebSecurity: false
  }
});

