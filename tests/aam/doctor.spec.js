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

test('Doctor completes consultation and creates lab test request', async ({ page }) => {

  await login(page);
  await page.getByRole('button', { name: 'Continue' }).click();

  const beneficiaryId = readJson(beneficiaryPath).beneficiaryId;
  expect(beneficiaryId).toBeTruthy();

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

  await page.getByRole('textbox', { name: 'Clinical Observations' })
    .fill('Patient complaints of high Fever for 4-5 days. Body Temperature is 103 degree F. No cough or sore throat.');

  await page.locator('.mat-mdc-select-placeholder').first().click();
  await page.getByRole('option', { name: 'Hemoglobin' })
    .locator('mat-pseudo-checkbox').click();
  await page.keyboard.press('Escape');

  await page.locator('div').filter({ hasText: /^Provisional Diagnosis$/ }).nth(3).click();
  await page.getByRole('combobox', { name: 'Provisional Diagnosis' }).pressSequentially('Fever');
  await page.waitForSelector('[role="option"]', { state: 'visible' });

  const feverOption = page.getByRole('option', { name: 'Fever', exact: true }).first();
  await expect(feverOption).toBeVisible();
  await feverOption.click();

  await page.getByRole('button', { name: 'Add' }).nth(1).click();
  await page.getByRole('combobox', { name: 'Form' }).click();
  await page.getByRole('option', { name: 'Tablet' }).click();
  await page.getByRole('combobox', { name: 'Medicine' }).click();
  await page.getByRole('combobox', { name: 'Medicine' }).fill('par');
  await page.getByText('Paracetamol 500mg').click();
  await page.getByRole('button', { name: 'OK' }).click();

  await page.getByRole('combobox', { name: 'Dosage' }).click();
  await page.getByText('Half Tab', { exact: true }).click();
  await page.getByRole('combobox', { name: 'Frequency' }).click();
  await page.getByText('Single Dose After Food').click();
  await page.getByRole('combobox', { name: 'Duration' }).click();
  await page.getByRole('option', { name: '5', exact: true }).click();
  await page.getByRole('combobox', { name: 'Unit' }).click();
  await page.getByRole('option', { name: 'Day(s)' }).click();
  await page.getByRole('button', { name: 'Add' }).nth(2).click();

  await page.getByRole('button', { name: 'Next', exact: true }).click();

  await page.getByRole('combobox', { name: 'Referred To Institute' }).click();
  await page.getByText('PHC').click();

  await page.locator('#mat-input-38').fill('Revisit');

  await page.getByRole('textbox', { name: 'Revisit Date' }).click();
  await page.getByRole('button', { name: 'Open calendar' }).click();

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  const dateButton = page.getByRole('button', {
    name: new RegExp(`${nextWeek.toLocaleString('en-US', { month: 'long' })} ${nextWeek.getDate()},`)
  });

  await dateButton.click();

  await page.getByRole('button', { name: 'Submit' }).click();
  await page.getByRole('button', { name: 'OK' }).click();
  await page.getByRole('button', { name: 'No' }).click();

  writeJson(testRequestPath, {
    beneficiaryId,
    testName: 'Hemoglobin',
    resultStatus: 'Pending'
  });
});
