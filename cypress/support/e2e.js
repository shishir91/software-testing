import "./commands";

// Make failures easier to debug (keep Cypress defaults otherwise).
Cypress.on("uncaught:exception", (err) => {
  // The app may throw occasional third‑party errors; don't fail the test run for those.
  // If you want strict mode, remove this handler.
  if (
    /ResizeObserver loop limit exceeded/i.test(err.message) ||
    /Script error/i.test(err.message)
  ) {
    return false;
  }
  return undefined;
});

