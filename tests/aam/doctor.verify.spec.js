import { test, expect } from '@playwright/test';
import { login } from "../../helpers/login.js";
import { readJson, writeJson } from "../../helpers/testData.js";
import { fileURLToPath } from 'url';
import * as path from 'path';
import * as fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testRequestPath = path.resolve(__dirname, '../../testRequest.json');
const beneficiaryPath = path.resolve(__dirname, '../../beneficiary.json');



test('Doctor verifies lab result and closes consultation', async ({ page }) => {
  await login(page);
  await page.getByRole('button', { name: 'Continue' }).click();

  const { beneficiaryId, result, resultStatus } = readJson(testRequestPath);
  expect(beneficiaryId).toBeTruthy();
  expect(resultStatus).toBe('Completed');
  expect(result).toBeTruthy();

  await page.getByRole('button', { name: 'Doctor' }).click();
  await page.getByRole('searchbox', { name: 'In-Table Search' }).fill(beneficiaryId);
  await page.getByRole('button', { name: 'search' }).click();
  await expect(page.locator('table')).toBeVisible();
  await page.getByRole('cell', { name: String(beneficiaryId) }).click();

  const okButton = page.getByRole('button', { name: 'OK' });
  await expect(okButton).toBeEnabled();
  await okButton.click();

  await page.getByRole('tabpanel', { name: 'Visit Details' })
    .getByRole('button', { name: 'Next' }).click();

  await page.getByRole('button', { name: 'Reports' }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Update' }).click();
  const frame = page.frameLocator('iframe');
await frame.locator('button.full-width-login:has-text("No")').click({ force: true });




  writeJson(testRequestPath, {});
});
