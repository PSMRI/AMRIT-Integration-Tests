import { test, expect } from '@playwright/test';
import { login } from "../../helpers/login.js";
import { readJson, writeJson } from "../../helpers/testData.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testRequestPath = path.join(__dirname, "../../testRequest.json");

test('Lab Technician fills the result for pending test', async ({ page }) => {

  await login(page);
  await page.getByRole('button', { name: 'Continue' }).click();

  const { beneficiaryId, testName } = readJson(testRequestPath);

  await page.getByRole('button', { name: 'Lab Technician' }).click();
  await page.getByRole('searchbox', { name: 'In-Table Search' }).fill(beneficiaryId);
  await page.getByRole('button', { name: 'search' }).click();
  await page.getByRole('cell', { name: String(beneficiaryId) }).click();

  const okButton = page.getByRole('button', { name: 'OK' });
  await okButton.click();

  await page.getByRole('textbox', { name: 'Result' }).fill('17');
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.getByRole('button', { name: 'OK' }).click();

  writeJson(testRequestPath, {
    beneficiaryId,
    testName,
    result: '17',
    resultStatus: 'Completed'
  });
});
