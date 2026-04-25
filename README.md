# Samparka Cypress tests (haus9)

This folder contains a standalone Cypress (JavaScript) test suite for the Samparka subdomain app.

## Quick start

```bash
cd "software-testing"
npm install
npm run cy:open
```

## Run headless

```bash
cd "software-testing"
npm test
```

## Target a different environment

By default tests run against `https://haus9.samparka.co`.

Override with:

```bash
cd "software-testing"
$env:CYPRESS_BASE_URL="https://haus9.samparka.co"
npm test
```

## Notes

- Tests are written to be **deterministic** by stubbing key backend APIs via `cy.intercept()` (so they can run without real credentials).
- If you want “real backend” E2E runs, you can remove/relax the intercepts and provide real test accounts.

