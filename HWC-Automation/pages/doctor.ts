import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://uatamrit.piramalswasthya.org/aam/#/login');
  await expect(page.getByRole('tabpanel', { name: 'Visit' })).toBeVisible();

  await page.getByRole('button', { name: 'Doctor' }).click();
  await expect(page.getByRole('tabpanel', { name: 'Current' })).toBeVisible();

  await page.getByRole('cell', { name: 'Isabel Boyer' }).click();
  await expect(page.getByRole('heading', { name: 'Info' })).toBeVisible();

  await page.getByRole('button', { name: 'OK' }).click();
  await expect(page.getByRole('tabpanel', { name: 'Visit Details' })).toBeVisible();

  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('tabpanel', { name: 'History' })).toBeVisible();

  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('heading', { name: 'Info' })).toBeVisible();

  await page.getByRole('button', { name: 'OK' }).click();
  await expect(page.getByRole('tabpanel', { name: 'Vitals' })).toBeVisible();

  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('tabpanel', { name: 'Examination' })).toBeVisible();

  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('tabpanel', { name: 'Case Record' })).toBeVisible();

  await page.getByRole('button', { name: 'Diagnosis' }).click();
  await expect(page.getByRole('region', { name: 'Diagnosis' })).toBeVisible();

  await page.locator('div').filter({ hasText: /^Provisional Diagnosis$/ }).nth(3).click();
  await page.getByRole('combobox', { name: 'Provisional Diagnosis' }).fill('fev');
  await page.waitForTimeout(3000); // wait for options to load
  await expect(page.getByRole('listbox', { name: 'Provisional Diagnosis' })).toBeVisible();

  await page.locator('#mat-option-344').click();
  await page.getByRole('button', { name: 'Add' }).click();
  await page.getByRole('button', { name: 'Investigations' }).click();
  await expect(page.getByRole('region', { name: 'Investigations' })).toBeVisible();

  await page.locator('.mat-mdc-select-arrow.ng-tns-c3393473648-180 > svg').click();
  await expect(page.getByRole('listbox', { name: 'Test Name' })).toBeVisible();

  await page.getByRole('option', { name: 'Hemoglobin' }).locator('mat-pseudo-checkbox').click();
  await expect(page.getByRole('combobox', { name: 'Test Name Hemoglobin' })).toBeVisible();

  await page.locator('.cdk-overlay-backdrop').click();
  await expect(page.getByRole('region', { name: 'Prescription' })).toBeVisible();

  await page.locator('.mat-mdc-select-placeholder.mat-mdc-select-min-line.ng-tns-c3393473648-185').click();
  await expect(page.getByRole('listbox', { name: 'Form' })).toBeVisible();

  await page.getByText('Tablet').click();
  await expect(page.getByRole('combobox', { name: 'Form Tablet' })).toBeVisible();

  await page.getByRole('combobox', { name: 'Medicine' }).click();
  await page.getByRole('combobox', { name: 'Medicine' }).fill('p');
  await page.getByText(' Paracetamol 500mg (199455) ').click();
  await expect(page.getByRole('combobox', { name: 'Route Oral' })).toBeVisible();

  await page.locator('.mat-mdc-select-arrow.ng-tns-c3393473648-189 > svg').click();
  await expect(page.getByRole('listbox', { name: 'Dosage' })).toBeVisible();

  await page.getByRole('option', { name: 'Half Tab', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Dosage Half Tab' })).toBeVisible();

  await page.locator('.mat-mdc-select-arrow.ng-tns-c3393473648-191 > svg').click();
  await expect(page.getByRole('listbox', { name: 'Frequency' })).toBeVisible();

  await page.getByText('Four Times in a Day (QID)').click();
  await expect(page.getByRole('combobox', { name: 'Frequency Four Times in a Day' })).toBeVisible();

  await page.locator('svg > .ng-tns-c3393473648-193').click();
  await expect(page.getByRole('listbox', { name: 'Duration' })).toBeVisible();

  await page.getByRole('option', { name: '5', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Duration' })).toBeVisible();

  await page.locator('.mat-mdc-select-arrow.ng-tns-c3393473648-195 > svg').click();
  await expect(page.getByRole('listbox', { name: 'Unit' })).toBeVisible();

  await page.getByRole('option', { name: 'Day(s)' }).click();
  await expect(page.getByRole('combobox', { name: 'Unit Day(s)' })).toBeVisible();

  await page.getByRole('button', { name: 'Add' }).click();
  await expect(page.getByRole('group', { name: 'Paracetamol 500mg' })).toBeVisible();

  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('tabpanel', { name: 'Revisit & Refer' })).toBeVisible();

  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByRole('heading', { name: 'Success' })).toBeVisible();

  await page.getByRole('button', { name: 'OK' }).click();
});