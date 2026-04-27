# Samparka Cypress E2E Tests (haus9)

This repository contains a standalone Cypress (JavaScript) automated testing suite for the Samparka full-stack MERN application. It focuses on the customer-facing pages, the store sub-admin pages for the `haus9` subdomain, and the central admin dashboard.

## Scope & Coverage

The test suite covers the following core areas:

- **Customer Flows (`customer.cy.js`, `customer_rewards.cy.js`, `reservation.cy.js`)**: 
  - Customer login and authentication (redirects to `/loyality`).
  - Rewards browsing and redemption workflows.
  - Service search and reservation booking.
- **Store Sub-Admin Flows (`storeAdmin.cy.js`)**:
  - PIN-based store login.
  - Points management (QR/NFC mode, adding/subtracting points).
  - Customer search and addition.
- **Central Admin Dashboard (`admin_dashboard.cy.js`)**:
  - Admin login via `samparka.co`.
  - Push campaign creation and messaging validation.

## Prerequisites

- **Node.js** (v16+ recommended)
- **Python 3** (Optional, for generating the `.docx` test report)

Before running the tests, ensure you have a `.env` file in the root directory (next to `cypress.config.js`) with the following credentials for the admin tests:

```env
ADMIN_EMAIL=your_admin_email@example.com
ADMIN_PASSWORD=your_admin_password
```

## Setup

```bash
# Navigate to the project directory
cd "software-testing"

# Install dependencies
npm install
```

## Running the Tests

### Interactive Mode (Cypress UI)

```bash
npm run cy:open
```

### Headless Mode (Command Line)

```bash
# Run all tests headlessly (Electron)
npm test

# Run all tests in a specific browser (e.g., Chrome)
npm run test:chrome

# Run all tests but keep the browser visible
npm run test:headed
```

### Target a Different Environment

By default, tests run against `https://haus9.samparka.co`. To run them against a local or staging environment, override the `CYPRESS_BASE_URL` environment variable:

```bash
# Windows (PowerShell)
$env:CYPRESS_BASE_URL="http://localhost:3000"
npm test

# macOS/Linux
CYPRESS_BASE_URL="http://localhost:3000" npm test
```

## Test Report Generation

This project includes a Python script that automatically generates a comprehensive Word document (`.docx`) detailing the test scope, approach, and execution summary. 

To generate the report:

```bash
pip install python-docx
python generate_test_report_docx.py
```
This will output a file named `Samparka_Cypress_Test_Report.docx` in the root directory.

## Testing Approach & Notes

- **Determinism**: Tests are written to be highly deterministic. To achieve this without requiring real production data or credentials for every run, critical backend APIs (like `/customer/register/haus9` or `/store/verifyPIN/haus9`) are stubbed using `cy.intercept()`.
- **Real E2E Runs**: If you want to perform "real backend" E2E runs, you can remove or relax the intercepts inside the test files and provide real test accounts.
- **Linting**: You can run `npm run lint` to execute ESLint and verify code quality.
