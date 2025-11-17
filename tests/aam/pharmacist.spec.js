import { test, expect } from '@playwright/test';
import { login } from '../../helpers/login.js';
import { readJson, writeJson } from "../../helpers/testData.js";
import { fileURLToPath } from 'url';
import * as path from 'path';
import * as fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testRequestPath = path.resolve(__dirname, '../../testRequest.json');

test('Pharmacist dispenses medication', async ({ page }) => {
  await login(page);
  await page.getByRole('button', { name: 'Continue' }).click();

  const { beneficiaryId, testName } = readJson(testRequestPath);

  await page.getByRole('button', { name: 'Pharmacist' }).click();
  await page.getByRole('searchbox', { name: 'In-Table Search' }).fill(beneficiaryId);
  await page.getByRole('button', { name: 'search' }).click();
  await page.getByRole('cell', { name: String(beneficiaryId) }).click();
  const okButton = page.getByRole('button', { name: 'OK' });
  await okButton.click();

  // TODO: Add steps to dispense medication and assert the outcome.
});