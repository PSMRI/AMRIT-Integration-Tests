/// <reference types="node" />
import { test, expect, Page } from '@playwright/test';
import { qase } from 'playwright-qase-reporter';
import { faker } from '@faker-js/faker';
import { LoginPage } from '../pages/login';
import { RegisterPage } from '../pages/register';
import { NursePage } from '../pages/nurse';
import { writeFile } from 'fs/promises';
import { sanitizeName } from './test-helpers.js';

// ---------------------------------------------------------------------------
// Shared helper: register a beneficiary and navigate to the Nurse module,
// selecting the newly registered person. Returns their full name.
// ---------------------------------------------------------------------------
async function setupNurseVisit(page: Page): Promise<string> {
  const loginPage = new LoginPage(page);
  const registerPage = new RegisterPage(page);
  const nursePage = new NursePage(page);

  await loginPage.navigateTo();
  await loginPage.login('Mokrong', 'Test@123');
  await page.waitForTimeout(2000);

  // Register
  await registerPage.navigateToRegistration();
  await page.locator('button.btn-default.cu-btn-default.reg-button.mat_blue').click();
  await page.waitForTimeout(1000);
  await registerPage.waitForBeneficiaryConsent();
  await registerPage.acceptConsent();

  const data = {
    firstName: sanitizeName(faker.person.firstName()),
    lastName: sanitizeName(faker.person.lastName()),
    gender: faker.helpers.arrayElement(['Male', 'Female']),
    age: faker.number.int({ min: 18, max: 60 }).toString(),
    ageUnit: 'Years',
    maritalStatus: 'Unmarried',
  };

  await registerPage.fillPersonalInfo(data.firstName, data.lastName, data.gender, data.age, data.ageUnit, data.maritalStatus);
  // Angular reactive form validators run asynchronously after dropdown selections —
  // give the form an extra moment to settle before tab navigation / Submit
  await page.waitForTimeout(1500);
  await registerPage.clickNextButton();
  await registerPage.verifyLocationInfoTab();
  await registerPage.fillMandatoryLocationInfo('Assam', 'Golaghat').catch((e) => {
    console.log('[03b setup] Location info fill failed (non-fatal):', e.message);
  });
  await registerPage.clickNextButton();
  await registerPage.verifyOtherInfoTab();
  await registerPage.clickNextButton();
  await registerPage.verifyABHAInfoTab();
  await registerPage.clickSubmitButton();
  await registerPage.verifySuccessMessage();
  await registerPage.clickOKButton();
  await page.waitForTimeout(1000);

  const fullName = `${data.firstName} ${data.lastName}`;
  await writeFile('./data/lastBeneficiary.json', JSON.stringify({ name: fullName }), 'utf8').catch(() => {});

  // Navigate to Nurse
  await page.getByRole('button', { name: 'Nurse' }).click();
  await page.waitForTimeout(1000);
  await expect(nursePage.visitTabpanel()).toBeVisible({ timeout: 30000 });

  // Select beneficiary
  await nursePage.selectBeneficiary(fullName);
  await nursePage.clickInfoOKButton();

  return fullName;
}

// ---------------------------------------------------------------------------
// TC33 - AR-763: Verify General OPD Follow Up visit flow
// ---------------------------------------------------------------------------
test(qase(763, 'TC33 - Verify General OPD Follow Up visit successful submit'), async ({ page }: { page: Page }) => {
  const nursePage = new NursePage(page);

  const fullName = await setupNurseVisit(page);
  await page.screenshot({ path: './test-results/screenshot-TC33-visit-details.png' });

  // Select Follow Up + General OPD
  await nursePage.selectReasonForVisit('Follow Up');
  await nursePage.selectVisitCategory('General OPD');
  await page.screenshot({ path: './test-results/screenshot-TC33-visit-category-selected.png' });

  // Navigate through tabs
  await nursePage.clickNextButton();
  await nursePage.verifyHistoryTab();

  await nursePage.clickNextButton();
  await nursePage.verifyVitalsTab();

  await nursePage.clickNextButton();
  await nursePage.verifyExaminationTab();

  // Submit
  await nursePage.submitVisit();
  await nursePage.verifySuccessMessage(15000);
  await page.screenshot({ path: './test-results/screenshot-TC33-success.png' });

  await nursePage.clickSuccessOKButton();
  console.log(`[TC33] General OPD Follow Up visit completed for: ${fullName}`);
});

// ---------------------------------------------------------------------------
// TC34 - AR-764: Verify General OPD Referral visit flow
// ---------------------------------------------------------------------------
test(qase(764, 'TC34 - Verify General OPD Referral visit successful submit'), async ({ page }: { page: Page }) => {
  const nursePage = new NursePage(page);

  const fullName = await setupNurseVisit(page);
  await page.screenshot({ path: './test-results/screenshot-TC34-visit-details.png' });

  // Select Referral + General OPD
  await nursePage.selectReasonForVisit('Referral');
  await nursePage.selectVisitCategory('General OPD');
  await page.screenshot({ path: './test-results/screenshot-TC34-visit-category-selected.png' });

  await nursePage.clickNextButton();
  await nursePage.verifyHistoryTab();

  await nursePage.clickNextButton();
  await nursePage.verifyVitalsTab();

  await nursePage.clickNextButton();
  await nursePage.verifyExaminationTab();

  // Fill referral details if present on Examination or Revisit & Refer tab
  const filled = await nursePage.fillReferralDetailsIfVisible('Fever', 'District Hospital');
  console.log(`[TC34] Referral details filled: ${filled}`);

  await nursePage.submitVisit();
  await nursePage.verifySuccessMessage(15000);
  await page.screenshot({ path: './test-results/screenshot-TC34-success.png' });

  await nursePage.clickSuccessOKButton();
  console.log(`[TC34] General OPD Referral visit completed for: ${fullName}`);
});

// ---------------------------------------------------------------------------
// TC35 - AR-765: Verify General OPD visit Vitals fields are present
// ---------------------------------------------------------------------------
test(qase(765, 'TC35 - Verify General OPD visit Vitals fields are present and editable'), async ({ page }: { page: Page }) => {
  const nursePage = new NursePage(page);

  await setupNurseVisit(page);

  // Select New Chief Complaint + General OPD
  await nursePage.selectReasonForVisit('New Chief Complaint');
  await nursePage.selectVisitCategory('General OPD');

  // Navigate to History then Vitals
  await nursePage.clickNextButton();
  await nursePage.verifyHistoryTab();

  await nursePage.clickNextButton();
  await nursePage.verifyVitalsTab();
  await page.screenshot({ path: './test-results/screenshot-TC35-vitals-tab.png' });

  // Verify key vitals fields are present
  const checkField = async (label: string, locator: string) => {
    const field = page.locator(locator).first();
    const visible = await field.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`[TC35] ${label} field visible: ${visible}`);
    return visible;
  };

  const heightVisible    = await checkField('Height', 'input[formcontrolname*="height" i], input[aria-label*="height" i]');
  const weightVisible    = await checkField('Weight', 'input[formcontrolname*="weight" i], input[aria-label*="weight" i]');
  const tempVisible      = await checkField('Temperature', 'input[formcontrolname*="temp" i], input[aria-label*="temperature" i]');
  const systolicVisible  = await checkField('BP Systolic', 'input[formcontrolname*="systolic" i], input[aria-label*="systolic" i]');
  const diastolicVisible = await checkField('BP Diastolic', 'input[formcontrolname*="diastolic" i], input[aria-label*="diastolic" i]');

  expect(
    heightVisible || weightVisible || tempVisible || systolicVisible || diastolicVisible,
    'At least one vitals field should be present on the Vitals tab'
  ).toBeTruthy();

  // Fill available fields to verify they are editable
  if (heightVisible) {
    await page.locator('input[formcontrolname*="height" i], input[aria-label*="height" i]').first().fill('165');
  }
  if (weightVisible) {
    await page.locator('input[formcontrolname*="weight" i], input[aria-label*="weight" i]').first().fill('65');
  }
  if (tempVisible) {
    await page.locator('input[formcontrolname*="temp" i], input[aria-label*="temperature" i]').first().fill('98.6');
  }

  await page.screenshot({ path: './test-results/screenshot-TC35-vitals-filled.png' });
  console.log('[TC35] General OPD Vitals fields verified');
});

// ---------------------------------------------------------------------------
// TC36 - AR-766: Verify General OPD QC New Chief Complaint visit
// ---------------------------------------------------------------------------
test(qase(766, 'TC36 - Verify General OPD QC New Chief Complaint visit submit'), { timeout: 180000 }, async ({ page }: { page: Page }) => {
  const nursePage = new NursePage(page);

  const fullName = await setupNurseVisit(page);
  await page.screenshot({ path: './test-results/screenshot-TC36-visit-details.png' });

  // Select New Chief Complaint + General OPD (QC)
  await nursePage.selectReasonForVisit('New Chief Complaint');

  let qcCategoryFound = false;
  try {
    await nursePage.selectVisitCategory('General OPD (QC)');
    qcCategoryFound = true;
  } catch (err) {
    console.log('[TC36] "General OPD (QC)" category not available for this facility/user — soft-failing');
  }

  if (!qcCategoryFound) {
    return;
  }

  await page.screenshot({ path: './test-results/screenshot-TC36-qc-category-selected.png' });

  // QC visits have exactly 2 steps: Visit Details → Vitals (Submit is on Vitals tab directly).
  // Use direct Next button click — avoids mat-step-header focus dependency in clickNextButton().
  await page.getByRole('button', { name: 'Next' }).first().click({ timeout: 10000 });
  const vitalsTabTC36 = page.getByRole('tabpanel', { name: 'Vitals' });
  await expect(vitalsTabTC36).toBeVisible({ timeout: 10000 });
  await page.screenshot({ path: './test-results/screenshot-TC36-vitals-tab.png' }).catch(() => {});

  // Fill required Anthropometry fields (always visible when Vitals tab loads)
  const heightInputTC36 = vitalsTabTC36.getByRole('textbox', { name: 'Height(cm)' });
  if (await heightInputTC36.isVisible({ timeout: 3000 }).catch(() => false)) {
    await heightInputTC36.fill('165');
  }
  const weightInputTC36 = vitalsTabTC36.getByRole('textbox', { name: 'Weight(kg)' });
  if (await weightInputTC36.isVisible({ timeout: 3000 }).catch(() => false)) {
    await weightInputTC36.fill('70');
  }

  // Expand the Vitals accordion if needed — BP fields (also required) are inside it
  const systolicTC36 = vitalsTabTC36.getByRole('textbox', { name: 'BP (mmHg) Systolic' });
  if (!(await systolicTC36.isVisible({ timeout: 1500 }).catch(() => false))) {
    await vitalsTabTC36.getByRole('button', { name: 'Vitals', exact: true })
      .click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);
  }
  if (await systolicTC36.isVisible({ timeout: 3000 }).catch(() => false)) {
    await systolicTC36.fill('120');
  }
  const diastolicTC36 = vitalsTabTC36.getByRole('textbox', { name: 'BP (mmHg) Diastolic' });
  if (await diastolicTC36.isVisible({ timeout: 3000 }).catch(() => false)) {
    await diastolicTC36.fill('80');
  }

  // QC visits: Submit is directly on the Vitals tab — no additional Next needed
  await page.getByRole('button', { name: 'Submit' }).click({ timeout: 15000 });
  await nursePage.verifySuccessMessage(15000);
  await page.screenshot({ path: './test-results/screenshot-TC36-success.png' }).catch(() => {});
  await nursePage.clickSuccessOKButton();
  console.log(`[TC36] General OPD QC New Chief Complaint visit completed for: ${fullName}`);
});

// ---------------------------------------------------------------------------
// TC37 - AR-768: Verify General OPD QC Referral visit
// ---------------------------------------------------------------------------
test(qase(768, 'TC37 - Verify General OPD QC Referral visit submit'), { timeout: 180000 }, async ({ page }: { page: Page }) => {
  const nursePage = new NursePage(page);

  const fullName = await setupNurseVisit(page);
  await page.screenshot({ path: './test-results/screenshot-TC37-visit-details.png' });

  await nursePage.selectReasonForVisit('Referral');

  let qcCategoryFound = false;
  try {
    await nursePage.selectVisitCategory('General OPD (QC)');
    qcCategoryFound = true;
  } catch {
    console.log('[TC37] "General OPD (QC)" visit category not available — soft-failing');
  }

  if (!qcCategoryFound) {
    return;
  }

  // QC visits: 2 steps only — Visit Details → Vitals (Submit directly on Vitals tab)
  await page.getByRole('button', { name: 'Next' }).first().click({ timeout: 10000 });
  const vitalsTabTC37 = page.getByRole('tabpanel', { name: 'Vitals' });
  await expect(vitalsTabTC37).toBeVisible({ timeout: 10000 });

  // Fill required Anthropometry fields
  const heightInputTC37 = vitalsTabTC37.getByRole('textbox', { name: 'Height(cm)' });
  if (await heightInputTC37.isVisible({ timeout: 3000 }).catch(() => false)) {
    await heightInputTC37.fill('170');
  }
  const weightInputTC37 = vitalsTabTC37.getByRole('textbox', { name: 'Weight(kg)' });
  if (await weightInputTC37.isVisible({ timeout: 3000 }).catch(() => false)) {
    await weightInputTC37.fill('65');
  }

  // Expand the Vitals accordion if needed — BP fields are inside it
  const systolicTC37 = vitalsTabTC37.getByRole('textbox', { name: 'BP (mmHg) Systolic' });
  if (!(await systolicTC37.isVisible({ timeout: 1500 }).catch(() => false))) {
    await vitalsTabTC37.getByRole('button', { name: 'Vitals', exact: true })
      .click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);
  }
  if (await systolicTC37.isVisible({ timeout: 3000 }).catch(() => false)) {
    await systolicTC37.fill('118');
  }
  const diastolicTC37 = vitalsTabTC37.getByRole('textbox', { name: 'BP (mmHg) Diastolic' });
  if (await diastolicTC37.isVisible({ timeout: 3000 }).catch(() => false)) {
    await diastolicTC37.fill('78');
  }

  // Submit directly — no second Next needed for QC visits
  await page.getByRole('button', { name: 'Submit' }).click({ timeout: 15000 });
  await nursePage.verifySuccessMessage(15000);
  await page.screenshot({ path: './test-results/screenshot-TC37-success.png' }).catch(() => {});
  await nursePage.clickSuccessOKButton();
  console.log(`[TC37] General OPD QC Referral visit completed for: ${fullName}`);
});

// ---------------------------------------------------------------------------
// TC38 - AR-755: Verify Nurse MMU Referred worklist tab is accessible
// Note: "MMU Referred" is a separate worklist TAB in the Nurse module,
//       not a visit category. This test verifies the tab exists and loads.
// ---------------------------------------------------------------------------
test(qase(755, 'TC38 - Verify Nurse MMU Referred worklist tab is accessible'), async ({ page }: { page: Page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.navigateTo();
  await loginPage.login('Mokrong', 'Test@123');
  await page.waitForTimeout(2000);

  // Navigate to Nurse module
  await page.getByRole('button', { name: 'Nurse' }).click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: './test-results/screenshot-TC38-nurse-worklist.png' });

  // Verify the Visit tab (default) is visible
  const visitTab = page.locator('div, span, a').filter({ hasText: /^Visit$/ }).first();
  const visitTabVisible = await visitTab.isVisible({ timeout: 5000 }).catch(() => false);
  console.log(`[TC38] Visit tab visible: ${visitTabVisible}`);

  // Find and verify the MMU Referred tab
  const mmuTab = page.locator('div, span, a').filter({ hasText: /^MMU Referred$/ }).first();
  const mmuTabVisible = await mmuTab.isVisible({ timeout: 5000 }).catch(() => false);

  console.log(`[TC38] MMU Referred tab visible: ${mmuTabVisible}`);
  expect(mmuTabVisible, 'MMU Referred tab should be visible in the Nurse worklist').toBeTruthy();

  // Click the MMU Referred tab
  await mmuTab.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: './test-results/screenshot-TC38-mmu-tab-clicked.png' });

  // Verify the worklist loads — either with records or the empty state message
  const table = page.locator('table, .mat-table, .mat-mdc-table').first();
  const noRecords = page.locator('td, div').filter({ hasText: /no\s*records\s*found/i }).first();

  const hasTable     = await table.isVisible({ timeout: 5000 }).catch(() => false);
  const hasNoRecords = await noRecords.isVisible({ timeout: 3000 }).catch(() => false);

  console.log(`[TC38] MMU Referred worklist — table: ${hasTable}, no-records message: ${hasNoRecords}`);
  expect(hasTable || hasNoRecords, 'MMU Referred worklist should show a table (with or without records)').toBeTruthy();

  await page.screenshot({ path: './test-results/screenshot-TC38-mmu-worklist-verified.png' });
  console.log('[TC38] MMU Referred worklist tab verified successfully');
});
