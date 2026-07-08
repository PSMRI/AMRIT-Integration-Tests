# HWC-Automation

Playwright end-to-end test suite for AMRIT HWC (uatamrit.piramalswasthya.org), covering login, registration, family tagging, nurse, doctor, lab, and pharmacist flows.

## Setup

```bash
npm install
npx playwright install
```

Create a `.env` file in the project root with your Qase API token (never commit this file — it's gitignored):

```
QASE_API_TOKEN=your_token_here
```

## Running tests

Run the full suite:

```bash
npm test
```

Run a specific test file:

```bash
npx playwright test tests/01-login.test.ts --project=chromium
```

Windows convenience scripts are also available:

- `run-tests.ps1` / `run-tests.bat` — run the suite (excluding the `07-e2e` master suite) and report to Qase, reading `QASE_API_TOKEN` from `.env`
- `run-tests-qase.ps1` / `run-tests-qase.bat` — run the core flow tests (login → register → nurse → doctor → lab → pharmacist) and push results to Qase project `AR` (AMRIT_Regression). Requires `$env:QASE_API_TOKEN` to be set before running.

## Codegen

Run Playwright codegen through npm so the local Playwright install is used:

```bash
npm run codegen -- https://uatamrit.piramalswasthya.org/aam/#/login
```

## Project structure

- `pages/` — page objects (login, register, nurse, doctor, lab_doctor, pharmacist)
- `tests/` — Playwright test specs, one per flow
- `src/server.ts` — MCP server entry point
- `.github/workflows/playwright.yml` — scheduled CI run (daily 4 AM UTC) against the Qase-tagged tests, using the `QASE_API_TOKEN` GitHub secret

## Reports

- HTML report: `test-results/index.html` (or `npx playwright show-report`)
- Qase run: https://app.qase.io/run/AR
