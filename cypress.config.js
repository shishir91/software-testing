import { defineConfig } from "cypress";

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
    baseUrl: process.env.CYPRESS_BASE_URL || "https://haus9.samparka.co",
    specPattern: "cypress/e2e/**/*.cy.js",
    supportFile: "cypress/support/e2e.js",
    fixturesFolder: "cypress/fixtures",
    chromeWebSecurity: false
  }
});

