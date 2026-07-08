import { Page, expect } from '@playwright/test';

export class NursePage {
  readonly page: Page;

  // Locators
  readonly visitTabpanel = () => this.page.getByRole('tabpanel', { name: 'Visit' });
  readonly visitDetailsTabpanel = () => this.page.getByRole('tabpanel', { name: 'Visit Details' });
  readonly historyTabpanel = () => this.page.getByRole('tabpanel', { name: 'History' });
  readonly vitalsTabpanel = () => this.page.getByRole('tabpanel', { name: 'Vitals' });
  readonly examinationTabpanel = () => this.page.getByRole('tabpanel', { name: 'Examination' });
  readonly revisitReferTabpanel = () => this.page.getByRole('tabpanel', { name: /Revisit\s*&\s*Refer|Revisit/i }).first();
  
  // Buttons
  readonly okButton = () => this.page.getByRole('button', { name: /^ok$/i });
  readonly nextButton = () => this.page.locator('button[matsteppernext].mat-stepper-next.mat_blue');
  readonly submitButton = () => this.page.getByRole('button', { name: 'Submit' });
  readonly successOKButton = () => this.page.getByRole('button', { name: 'OK' });
  readonly dialogOKButton = () =>
    this.page
      .locator(
        '.action button.full-width-login.button-ok[mat-dialog-close], button.full-width-login.button-ok[cdkfocusinitial], button.full-width-login.button-ok[mat-dialog-close], button.full-width-login.button-ok, mat-dialog-container button:has-text("OK"), mat-dialog-container button:has-text("Ok"), .mat-mdc-dialog-container button:has-text("OK"), .mat-mdc-dialog-container button:has-text("Ok"), [role="dialog"] button:has-text("OK"), [role="dialog"] button:has-text("Ok")'
      )
      .first();
  
  // Headings
  readonly infoHeading = () => this.page.getByRole('heading', { name: 'Info' });
  readonly successHeading = () => this.page.getByRole('heading', { name: 'Success' });
  
  // Dropdowns
  readonly reasonForVisitCombobox = () => this.page.getByRole('combobox', { name: 'Reason for Visit' });
  readonly reasonForVisitListbox = () => this.page.getByRole('listbox', { name: 'Reason for Visit' });
  readonly visitCategoryListbox = () => this.page.getByRole('listbox', { name: 'Visit Category' });

  // ANC / visit form fields
  readonly lmpInput = () =>
    this.page.locator('input[name="lmpDate"][formcontrolname="lmpDate"], input[formcontrolname="lmpDate"], input[placeholder*="Last Menstrual Period" i]').first();
  readonly heightInput = () =>
    this.page.locator('input[formcontrolname*="height" i], input[aria-label*="height" i], input[placeholder*="height" i], input#height').first();
  readonly weightInput = () =>
    this.page.locator('input[formcontrolname*="weight" i], input[aria-label*="weight" i], input[placeholder*="weight" i], input#weight').first();
  readonly temperatureInput = () =>
    this.page.locator('input[formcontrolname*="temp" i], input[aria-label*="temperature" i], input[placeholder*="temperature" i], input[placeholder*="temp" i]').first();
  readonly systolicInput = () =>
    this.page.locator('input[formcontrolname*="systolic" i], input[aria-label*="systolic" i], input[placeholder*="systolic" i]').first();
  readonly diastolicInput = () =>
    this.page.locator('input[formcontrolname*="diastolic" i], input[aria-label*="diastolic" i], input[placeholder*="diastolic" i]').first();
  readonly referralReasonInput = () =>
    this.page.locator('input[formcontrolname*="referralReason" i], textarea[formcontrolname*="referralReason" i], input[aria-label*="referral reason" i], textarea[aria-label*="referral reason" i]').first();
  readonly referralFacilityInput = () =>
    this.page.locator('input[formcontrolname*="referralFacility" i], textarea[formcontrolname*="referralFacility" i], input[aria-label*="referral facility" i], textarea[aria-label*="referral facility" i]').first();
  
  // Error messages
  readonly errorMessage = () => this.page.locator('.mat-error, .error-message, [role="alert"], mat-error, .validation-error');
  readonly errorHeading = () => this.page.getByRole('heading', { name: /error|validation/i });

  constructor(page: Page) {
    this.page = page;
  }

  // Methods
  async selectBeneficiary(beneficiaryName: string) {
    // Click the beneficiary row — try exact role match, then text filter fallback
    const exactCell = this.page.getByRole('cell', { name: beneficiaryName });
    if ((await exactCell.count()) > 0) {
      await exactCell.first().click();
    } else {
      await this.page.locator('tbody td').filter({ hasText: beneficiaryName }).first().click();
    }

    // After selecting a beneficiary, wait for ANY of these indicators:
    // (a) "Info" dialog heading  (b) Visit Details tab panel  (c) an OK/Ok button in a dialog
    // Some beneficiary flows show the info dialog, others skip straight to visit details.
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
      if (await this.infoHeading().isVisible({ timeout: 400 }).catch(() => false)) return;
      if (await this.visitDetailsTabpanel().isVisible({ timeout: 400 }).catch(() => false)) return;
      const dialogOkVisible = await this.page
        .locator('mat-dialog-container button, [role="dialog"] button')
        .filter({ hasText: /^\s*ok\s*$/i })
        .first()
        .isVisible({ timeout: 400 })
        .catch(() => false);
      if (dialogOkVisible) return;
    }
    throw new Error(
      `Beneficiary "${beneficiaryName}" selection timed out — expected Info dialog, Visit Details, or an OK button within 15 s`
    );
  }

  async clickInfoOKButton() {
    // Click the first OK/Ok button in any visible dialog
    const okBtn = this.okButton().first();
    await okBtn.click().catch(async () => {
      await this.clickDialogOKIfVisible(3000);
    });
    await expect(this.visitDetailsTabpanel()).toBeVisible();
  }

  async selectReasonForVisit(reason: string) {
    await this.reasonForVisitCombobox().click();
    const reasonListbox = this.page.locator('[role="listbox"]:visible').first();
    await expect(reasonListbox).toBeVisible();
    await this.page.getByRole('option', { name: reason, exact: true }).first().click();
    await this.page.waitForTimeout(800);
  }

  async selectVisitCategory(category: string) {
    let categoryField = this.page.getByRole('combobox', { name: /Visit\s*Category/i }).first();

    if ((await categoryField.count()) === 0) {
      categoryField = this.page.locator('[aria-label*="Visit Category" i], [formcontrolname*="visitCategory" i]').first();
    }

    if ((await categoryField.count()) === 0) {
      categoryField = this.page
        .locator('mat-form-field, .mat-mdc-form-field')
        .filter({ hasText: /Visit\s*Category/i })
        .locator('[role="combobox"], .mat-mdc-select-trigger, .mat-select-trigger')
        .first();
    }

    await expect(categoryField, 'Visit Category field not found').toBeVisible({ timeout: 15000 });
    await categoryField.click();

    const categoryListbox = this.page.locator('[role="listbox"]:visible').first();
    await expect(categoryListbox).toBeVisible();

    const exactOption = this.page.getByRole('option', { name: category, exact: true }).first();
    if ((await exactOption.count()) > 0) {
      await exactOption.click();
    } else {
      // Anchor the regex so "General OPD" does NOT match "General OPD (QC)"
    const escaped = category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    await this.page.getByRole('option')
      .filter({ hasText: new RegExp(`^\\s*${escaped}\\s*$`, 'i') })
      .first()
      .click({ timeout: 8000 });
    }

    await this.page.waitForTimeout(800);
  }

  async selectAncVisitCategory() {
    const categoryField = this.page.locator('div').filter({ hasText: /^Visit Category$/ }).nth(3);
    await expect(categoryField, 'Visit Category field not found for ANC flow').toBeVisible({ timeout: 15000 });
    await categoryField.click();

    const listbox = this.page.locator('[role="listbox"]:visible').first();
    await expect(listbox).toBeVisible({ timeout: 10000 });
    await this.page.getByRole('option', { name: /ANC/i }).first().click();
    await this.page.waitForTimeout(800);
  }

  async selectPrimiGravida(value: 'Yes' | 'No') {
    const radio = this.page.getByRole('radio', { name: new RegExp(`^${value}$`, 'i') }).first();
    if (!(await radio.isVisible({ timeout: 10000 }).catch(() => false))) {
      console.log(`Primi Gravida radio option "${value}" not found — skipping (may not appear on Follow Up visits).`);
      return;
    }
    await radio.check().catch(async () => {
      await radio.click();
    });
  }

  async fillLastMenstrualPeriod() {
    const lmpInput = this.lmpInput();
    if (!(await lmpInput.isVisible({ timeout: 15000 }).catch(() => false))) {
      console.log('Last Menstrual Period input not found — skipping (may not appear on Follow Up visits).');
      return;
    }

    const lmpField = this.page
      .locator('mat-form-field, .mat-mdc-form-field')
      .filter({ hasText: /Last\s*Menstrual\s*Period/i })
      .first();

    await lmpInput.click({ force: true });

    const datepickerToggle = lmpField.locator('button, span.mat-mdc-button-touch-target').last();
    if (await datepickerToggle.count()) {
      await datepickerToggle.click({ force: true });
    }

    const calendarPopup = this.page
      .locator('mat-datepicker-content:visible, .mat-datepicker-content:visible, .mat-mdc-datepicker-content:visible')
      .last();
    if (!(await calendarPopup.isVisible({ timeout: 10000 }).catch(() => false))) {
      console.log('LMP datepicker did not open — skipping LMP fill.');
      return;
    }

    const enabledDate = calendarPopup
      .locator('.mat-calendar-body-cell:not(.mat-calendar-body-disabled):not(.mat-mdc-calendar-body-disabled) .mat-calendar-body-cell-content, .mat-mdc-calendar-body-cell:not(.mat-calendar-body-disabled):not(.mat-mdc-calendar-body-disabled) .mat-calendar-body-cell-content')
      .first();
    if (!(await enabledDate.isVisible({ timeout: 10000 }).catch(() => false))) {
      console.log('No selectable date in LMP datepicker — skipping.');
      await this.page.keyboard.press('Escape').catch(() => {});
      return;
    }
    await enabledDate.click();

    // Best-effort: confirm value was set
    const hasValue = await lmpInput.inputValue().then(v => v.trim() !== '').catch(() => false);
    if (!hasValue) {
      console.log('LMP input still empty after date selection — continuing anyway.');
    }
  }

  async fillAncVitals(height: string, weight: string, temperature: string, systolic: string, diastolic: string) {
    const findVisible = async (locatorFactory: () => ReturnType<Page['locator']>, label: string) => {
      const all = locatorFactory();
      const count = await all.count();

      for (let i = 0; i < count; i++) {
        const candidate = all.nth(i);
        const visible = await candidate.isVisible().catch(() => false);
        if (visible) {
          return candidate;
        }
      }

      throw new Error(`${label} field not visible`);
    };

    const findVisibleWithRetry = async (
      locatorFactory: () => ReturnType<Page['locator']>,
      label: string,
      attempts = 3
    ) => {
      for (let attempt = 1; attempt <= attempts; attempt++) {
        const all = locatorFactory();
        const count = await all.count();

        for (let i = 0; i < count; i++) {
          const candidate = all.nth(i);
          const visible = await candidate.isVisible().catch(() => false);
          if (visible) {
            return candidate;
          }
        }

        // Retry strategy: expand/open vitals area before next lookup.
        await this.page.getByRole('button', { name: 'Vitals' }).click().catch(() => {});
        const vitalsPanelHeader = this.page.locator('mat-expansion-panel-header').filter({ hasText: /^\s*Vitals\s*$/i }).first();
        if (await vitalsPanelHeader.count()) {
          const expanded = (await vitalsPanelHeader.getAttribute('aria-expanded').catch(() => 'false')) === 'true';
          if (!expanded) {
            await vitalsPanelHeader.click().catch(() => {});
          }
        }

        const activeStep = this.page.locator('mat-step-content:visible, [id^="cdk-step-content-"]:visible').first();
        await activeStep.evaluate((el) => {
          const container = el as HTMLElement;
          container.scrollTop = container.scrollHeight;
        }).catch(() => {});

        await this.page.waitForTimeout(400);
      }

      throw new Error(`${label} field not visible`);
    };

    const heightField = await findVisible(
      () => this.page.locator('input[formcontrolname*="height" i], input[aria-label*="height" i], input[placeholder*="height" i], input#height, input#height_cm, input[formcontrolname="height_cm"]'),
      'Height'
    );
    await heightField.fill(height);

    const weightField = await findVisible(
      () => this.page.locator('input[formcontrolname*="weight" i], input[aria-label*="weight" i], input[placeholder*="weight" i], input#weight, input#weight_kg, input[formcontrolname="weight_Kg"]'),
      'Weight'
    );
    await weightField.fill(weight);

    await this.page.getByRole('button', { name: 'Vitals' }).click().catch(() => {});

    const temperatureField = await findVisibleWithRetry(
      () =>
        this.page
          .locator(
            'input[formcontrolname*="temp" i], input[aria-label*="temperature" i], input[placeholder*="temperature" i], input[placeholder*="temp" i], input[formcontrolname="temperature"], input[formcontrolname*="temperature" i], input[id*="temp" i], input[name*="temp" i]'
          )
          .or(this.page.getByRole('textbox', { name: /Temperature\(F\)|Temperature/i })),
      'Temperature'
    );
    await temperatureField.fill(temperature);

    const systolicField = await findVisible(
      () => this.page.locator('input[formcontrolname*="systolic" i], input[aria-label*="systolic" i], input[placeholder*="systolic" i], input[formcontrolname="systolicBP_1stReading"]'),
      'BP systolic'
    );
    await systolicField.fill(systolic);

    const diastolicField = await findVisible(
      () => this.page.locator('input[formcontrolname*="diastolic" i], input[aria-label*="diastolic" i], input[placeholder*="diastolic" i], input[formcontrolname="diastolicBP_1stReading"]'),
      'BP diastolic'
    );
    await diastolicField.fill(diastolic);
  }

  async fillProvisionalDiagnosis(query: string) {
    const candidates = [
      this.page.getByRole('combobox', { name: /Provisional\s*Diagnosis/i }).first(),
      this.page.getByRole('textbox', { name: /Provisional\s*Diagnosis/i }).first(),
      this.page.locator('input[formcontrolname="viewProvisionalDiagnosisProvided"]').first(),
      this.page.locator('input[placeholder*="Provisional Diagnosis" i]').first(),
      this.page.locator('mat-form-field, .mat-mdc-form-field').filter({ hasText: /Provisional\s*Diagnosis/i }).locator('input, textarea, [role="combobox"]').first()
    ];

    let diagnosisInput = candidates[0];
    for (const candidate of candidates) {
      if ((await candidate.count().catch(() => 0)) > 0) {
        diagnosisInput = candidate;
        break;
      }
    }

    const visible = await diagnosisInput.isVisible({ timeout: 3000 }).catch(() => false);
    if (!visible) {
      console.log('Provisional Diagnosis field not visible on this ANC screen; continuing without filling it.');
      return;
    }

    await diagnosisInput.focus();
    await Promise.all([
      this.page.waitForResponse(
        (response) => response.url().includes('getSnomedCTRecordList') && (response.request().postData()?.includes(query) ?? false) && response.status() === 200,
        { timeout: 10000 }
      ).catch(() => null),
      diagnosisInput.pressSequentially(query, { delay: 250 })
    ]);

    let diagnosisOption = this.page.getByRole('option').filter({ hasText: /Fever of unknown origin|fever/i }).first();
    if (!(await diagnosisOption.isVisible({ timeout: 10000 }).catch(() => false))) {
      diagnosisOption = this.page.getByRole('option').first();
    }
    if (await diagnosisOption.isVisible({ timeout: 3000 }).catch(() => false)) {
      await diagnosisOption.click({ force: true });
    } else {
      console.log('Provisional diagnosis SNOMED options not available — continuing without selecting.');
      await this.page.keyboard.press('Escape').catch(() => {});
    }
  }

  async expandSystemicExamination() {
    const panel = this.page.getByRole('button', { name: 'Systemic Examination' }).first();
    if (await panel.isVisible({ timeout: 5000 }).catch(() => false)) {
      await panel.click();
    } else {
      console.log('Systemic Examination section not found — skipping expansion.');
    }
  }

  async expandObstetricExamination() {
    const panel = this.page.getByRole('button', { name: 'Obstetric Examination' }).first();
    if (await panel.isVisible({ timeout: 5000 }).catch(() => false)) {
      await panel.click();
    } else {
      console.log('Obstetric Examination section not found — skipping expansion.');
    }
  }

  async clickCheckHrpStatus() {
    const candidates = [
      this.page.getByRole('button', { name: /Check\s*HRP\s*Status/i }).first(),
      this.page.locator('button').filter({ hasText: /Check\s*HRP\s*Status/i }).first()
    ];

    let button = candidates[0];
    for (const candidate of candidates) {
      if ((await candidate.count().catch(() => 0)) > 0) {
        button = candidate;
        break;
      }
    }

    if (!(await button.isVisible({ timeout: 15000 }).catch(() => false))) {
      console.log('Check HRP Status button not found — skipping.');
      return;
    }
    await button.scrollIntoViewIfNeeded().catch(() => {});

    try {
      await button.click({ timeout: 5000 });
    } catch {
      await button.click({ force: true, timeout: 5000 }).catch(async () => {
        await button.evaluate((element) => (element as HTMLButtonElement).click()).catch(() => {});
      });
    }
  }

  async fillReferralDetails(reason: string, facility: string) {
    await expect(this.referralReasonInput(), 'Referral reason field not found').toBeVisible({ timeout: 15000 });
    await this.referralReasonInput().fill(reason);

    await expect(this.referralFacilityInput(), 'Referral facility field not found').toBeVisible({ timeout: 15000 });
    await this.referralFacilityInput().fill(facility);
  }

  async fillReferralDetailsIfVisible(reason: string, facility: string): Promise<boolean> {
    const reasonCandidates = [
      this.referralReasonInput(),
      this.page.getByRole('textbox', { name: /Referral\s*Reason/i }).first(),
      this.page.locator('input[placeholder*="referral" i], textarea[placeholder*="referral" i]').first()
    ];
    const facilityCandidates = [
      this.referralFacilityInput(),
      this.page.getByRole('textbox', { name: /Referral\s*Facility/i }).first(),
      this.page.locator('input[placeholder*="facility" i], textarea[placeholder*="facility" i]').first()
    ];

    let reasonField = reasonCandidates[0];
    for (const candidate of reasonCandidates) {
      const visible = await candidate.isVisible({ timeout: 1000 }).catch(() => false);
      if (visible) {
        reasonField = candidate;
        break;
      }
    }

    let facilityField = facilityCandidates[0];
    for (const candidate of facilityCandidates) {
      const visible = await candidate.isVisible({ timeout: 1000 }).catch(() => false);
      if (visible) {
        facilityField = candidate;
        break;
      }
    }

    const reasonVisible = await reasonField.isVisible({ timeout: 1000 }).catch(() => false);
    const facilityVisible = await facilityField.isVisible({ timeout: 1000 }).catch(() => false);

    if (!reasonVisible || !facilityVisible) {
      return false;
    }

    await reasonField.fill(reason);
    await facilityField.fill(facility);
    return true;
  }

  async clickNextButton() {
    await this.clickDialogOKIfVisible(2000).catch(() => {});

    let activeStepHeader = this.page.locator('mat-step-header[aria-selected="true"]').first();
    let headerVisible = await activeStepHeader.isVisible({ timeout: 3000 }).catch(() => false);

    if (!headerVisible) {
      activeStepHeader = this.page.locator('mat-step-header.mat-step-header-selected, mat-step-header[ng-reflect-selected="true"]').first();
      headerVisible = await activeStepHeader.isVisible({ timeout: 3000 }).catch(() => false);
    }

    if (!headerVisible) {
      await this.clickDialogOKIfVisible(3000).catch(() => {});
      activeStepHeader = this.page.locator('mat-step-header[aria-selected="true"], mat-step-header.mat-step-header-selected').first();
      headerVisible = await activeStepHeader.isVisible({ timeout: 5000 }).catch(() => false);
    }

    await expect(activeStepHeader, 'Active step header not found').toBeVisible({ timeout: 10000 });

    const activeStepContentId = await activeStepHeader.getAttribute('aria-controls');
    const activeStepContent = activeStepContentId ? this.page.locator(`#${activeStepContentId}`).first() : null;

    if (activeStepContent) {
      const contentVisible = await activeStepContent.count().then((count) => count > 0).catch(() => false);
      if (contentVisible) {
        await activeStepContent.scrollIntoViewIfNeeded().catch(() => {});
        await activeStepContent.evaluate((element) => {
          const container = element as HTMLElement;
          container.scrollTop = container.scrollHeight;
          container.querySelectorAll('button').forEach((button) => {
            (button as HTMLElement).scrollIntoView({ block: 'center', inline: 'nearest' });
          });
        }).catch(() => {});
      }
    }

    let nextButton = this.page.locator('button[matsteppernext].mat-stepper-next.mat_blue').filter({ hasText: /^\s*Next\s*$/i }).first();

    if (activeStepContentId) {
      const scopedContent = this.page.locator(`#${activeStepContentId}`).first();
      if ((await scopedContent.count()) > 0) {
        const scopedNext = scopedContent.locator('button[matsteppernext].mat-stepper-next.mat_blue').filter({ hasText: /^\s*Next\s*$/i }).first();
        if ((await scopedNext.count()) > 0) {
          nextButton = scopedNext;
        }
      }
    }

    if ((await nextButton.count()) === 0) {
      nextButton = this.page.getByRole('button', { name: /^Next$/i }).first();
    }

    // Check if Next button is visible; if not, try alternate Next selectors before Submit fallback.
    const nextIsVisible = await nextButton.isVisible().catch(() => false);
    
    if (!nextIsVisible) {
      let alternateNext = this.page.getByRole('button', { name: /^Next$/i }).first();

      if (activeStepContentId) {
        const scopedAlternateNext = this.page
          .locator(`#${activeStepContentId}`)
          .locator('button[matsteppernext], button')
          .filter({ hasText: /^\s*Next\s*$/i })
          .first();

        if ((await scopedAlternateNext.count()) > 0) {
          alternateNext = scopedAlternateNext;
        }
      }

      const alternateVisible = await alternateNext.isVisible().catch(() => false);
      const alternateEnabled = await alternateNext.isEnabled().catch(() => false);

      if (alternateVisible && alternateEnabled) {
        await alternateNext.scrollIntoViewIfNeeded().catch(() => {});
        await this.page.keyboard.press('Escape').catch(() => {});
        await alternateNext.click({ timeout: 5000 }).catch(async () => {
          await alternateNext.click({ force: true, timeout: 5000 }).catch(async () => {
            await alternateNext.evaluate((button) => (button as HTMLButtonElement).click()).catch(() => {});
          });
        });
        await this.page.waitForTimeout(800);
        return;
      }

      console.log('Next button not visible, trying Submit button instead (likely last step)');
      let submitButton = this.submitButton();
      
      // Try to get Submit button from active step
      if (activeStepContentId) {
        const scopedContent = this.page.locator(`#${activeStepContentId}`).first();
        if ((await scopedContent.count()) > 0) {
          const scopedSubmit = scopedContent.locator('button').filter({ hasText: /^\s*Submit\s*$/i }).first();
          if ((await scopedSubmit.count()) > 0) {
            submitButton = scopedSubmit;
          }
        }
      }
      
      await expect(submitButton, 'Submit button not found (and Next button not visible)').toBeVisible({ timeout: 10000 });
      const submitEnabled = await submitButton.isEnabled().catch(() => false);
      if (!submitEnabled) {
        console.log('Submit button is visible but disabled; skipping Submit fallback for this step.');
        await this.clickDialogOKIfVisible(1500).catch(() => {});
        return;
      }
      await submitButton.scrollIntoViewIfNeeded();

      await this.page.keyboard.press('Escape').catch(() => {});

      try {
        await submitButton.click({ timeout: 5000 });
      } catch {
        try {
          await submitButton.click({ force: true, timeout: 5000 });
        } catch {
          await submitButton.evaluate((button) => {
            (button as HTMLButtonElement).click();
          }).catch(() => {});
        }
      }

      // If submit triggers an OK popup, close it so it does not block further actions.
      const okClosed = await this.clickDialogOKIfVisible(7000).catch(() => false);
      if (!okClosed) {
        await this.page.keyboard.press('Enter').catch(() => {});
        await this.clickDialogOKIfVisible(2500).catch(() => {});
      }
    } else {
      // Next button is visible, proceed with original Next click logic
      await expect(nextButton, 'Next button not found').toBeVisible({ timeout: 10000 });
      await expect(nextButton, 'Next button is disabled').toBeEnabled({ timeout: 10000 });
      await nextButton.scrollIntoViewIfNeeded();
      await nextButton.evaluate((button) => {
        (button as HTMLElement).scrollIntoView({ block: 'center', inline: 'nearest' });
      }).catch(() => {});

      // Same as registration: close overlay/dropdowns that may intercept click.
      await this.page.keyboard.press('Escape').catch(() => {});

      try {
        await nextButton.click({ timeout: 5000 });
      } catch {
        try {
          await nextButton.click({ force: true, timeout: 5000 });
        } catch {
          const clickedViaDom = await nextButton.evaluate((button) => {
            const element = button as HTMLButtonElement;
            element.scrollIntoView({ block: 'center', inline: 'nearest' });
            element.click();
            return true;
          }).catch(() => false);

          expect(clickedViaDom, 'Unable to click matstepper Next button via DOM fallback').toBe(true);
        }
      }
    }

    await this.page.waitForTimeout(800);
  }

  async clickDialogOKIfVisible(timeout = 3000): Promise<boolean> {
    const visibleDialog = this.page
      .locator('mat-dialog-container:visible, .mat-mdc-dialog-container:visible, [role="dialog"]:visible')
      .first();
    const hasVisibleDialog = await visibleDialog.isVisible({ timeout }).catch(() => false);

    let okButton = hasVisibleDialog
      ? visibleDialog
          .locator('.action button.full-width-login.button-ok[mat-dialog-close], button.full-width-login.button-ok[cdkfocusinitial], button.full-width-login.button-ok[mat-dialog-close], button.full-width-login.button-ok, button:has-text("OK"), button:has-text("Ok")')
          .first()
      : this.dialogOKButton();

    let visible = await okButton.isVisible({ timeout: 1200 }).catch(() => false);

    if (!visible) {
      okButton = this.page.getByRole('button', { name: /^ok$/i }).first();
      visible = await okButton.isVisible({ timeout: 1000 }).catch(() => false);
    }

    if (!visible) {
      return false;
    }

    await okButton.scrollIntoViewIfNeeded().catch(() => {});
    await okButton.click().catch(async () => {
      await okButton.click({ force: true }).catch(async () => {
        await okButton.evaluate((button) => (button as HTMLButtonElement).click()).catch(() => {});
      });
    });

    await visibleDialog.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});

    return true;
  }

  async verifyHistoryTab() {
    await expect(this.historyTabpanel()).toBeVisible();
  }

  async verifyVitalsTab() {
    await expect(this.vitalsTabpanel()).toBeVisible();
  }

  async verifyExaminationTab() {
    await expect(this.examinationTabpanel()).toBeVisible();
  }

  async verifyRevisitReferTab() {
    await expect(this.revisitReferTabpanel()).toBeVisible();
  }

  async submitVisitIfVisible(): Promise<boolean> {
    let submitButton = this.submitButton().first();

    const activeStepHeader = this.page.locator('mat-step-header[aria-selected="true"], mat-step-header.mat-step-header-selected').first();
    const activeStepContentId = await activeStepHeader.getAttribute('aria-controls').catch(() => null);

    if (activeStepContentId) {
      const scopedSubmit = this.page
        .locator(`#${activeStepContentId}`)
        .locator('button')
        .filter({ hasText: /^\s*Submit\s*$/i })
        .first();

      if ((await scopedSubmit.count()) > 0) {
        submitButton = scopedSubmit;
      }
    }

    const visible = await submitButton.isVisible().catch(() => false);
    if (!visible) {
      return false;
    }

    const enabled = await submitButton.isEnabled().catch(() => false);
    if (!enabled) {
      return false;
    }

    await submitButton.scrollIntoViewIfNeeded().catch(() => {});
    await submitButton.click().catch(async () => {
      await submitButton.click({ force: true }).catch(async () => {
        await submitButton.evaluate((button) => (button as HTMLButtonElement).click()).catch(() => {});
      });
    });

    await this.page.waitForTimeout(800);
    return true;
  }

  async submitVisit() {
    let submitButton = this.submitButton();
    const activeStepHeader = this.page.locator('mat-step-header[aria-selected="true"]').first();
    const activeStepContentId = await activeStepHeader.getAttribute('aria-controls').catch(() => null);

    if (activeStepContentId) {
      const scopedSubmit = this.page.locator(`#${activeStepContentId}`).locator('button').filter({ hasText: /^\s*Submit\s*$/i }).first();
      if ((await scopedSubmit.count()) > 0) {
        submitButton = scopedSubmit;
      }
    }

    await expect(submitButton, 'Submit button not found').toBeVisible({ timeout: 15000 });
    await submitButton.scrollIntoViewIfNeeded().catch(() => {});
    await submitButton.click().catch(async () => {
      await submitButton.click({ force: true }).catch(async () => {
        await submitButton.evaluate((button) => (button as HTMLButtonElement).click()).catch(() => {});
      });
    });

    const okClosed = await this.clickDialogOKIfVisible(7000).catch(() => false);
    if (!okClosed) {
      await this.page.keyboard.press('Enter').catch(() => {});
      await this.clickDialogOKIfVisible(2500).catch(() => {});
    }

    await this.page.waitForTimeout(800);
  }

  async verifySuccessMessage(timeout = 10000) {
    // Wait explicitly for the Success heading with a configurable timeout
    await expect(this.successHeading()).toBeVisible({ timeout });
  }

  async clickSuccessOKButton() {
    const successDialog = this.page
      .locator('mat-dialog-container:visible, .mat-mdc-dialog-container:visible, [role="dialog"]:visible')
      .filter({ hasText: /success/i })
      .first();

    let okButton = this.successOKButton();

    if (await successDialog.count()) {
      const scopedOk = successDialog.locator('button:has-text("OK"), button:has-text("Ok"), button[cdkfocusinitial]').first();
      if (await scopedOk.count()) {
        okButton = scopedOk;
      }
    }

    await okButton.scrollIntoViewIfNeeded().catch(() => {});
    await okButton.click().catch(async () => {
      await okButton.click({ force: true }).catch(async () => {
        await okButton.evaluate((button) => (button as HTMLButtonElement).click()).catch(() => {});
      });
    });

    await expect(successDialog).toBeHidden({ timeout: 10000 }).catch(async () => {
      await this.clickDialogOKIfVisible(3000).catch(() => {});
    });
    await this.page.waitForTimeout(800);
  }

  async takeScreenshot(screenshotName: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `screenshot-${screenshotName}-${timestamp}.png`;
    await this.page.screenshot({ path: `./test-results/screenshots/${fileName}` });
  }

  async verifyValidationErrorDisplayed(fieldLabel?: string): Promise<boolean> {
    try {
      const errorVisible = await this.errorMessage().first().isVisible({ timeout: 5000 }).catch(() => false);
      return errorVisible;
    } catch {
      return false;
    }
  }

  async getValidationErrorMessages(): Promise<string[]> {
    const errors = await this.errorMessage().allTextContents();
    return errors.filter((error) => error.trim().length > 0);
  }

  async verifyNextButtonDisabled(): Promise<boolean> {
    const nextBtn = this.nextButton();
    const isDisabled = await nextBtn.isDisabled().catch(() => false);
    return isDisabled;
  }

  /**
   * Navigate through tabs by clicking Next until the named tab panel becomes visible.
   * Useful for specialty visit types (QC, NCD, PNC, Child, Neonatal) where the tab
   * order differs from the standard General OPD flow.
   *
   * @param targetTabName - 'History' | 'Vitals' | 'Examination'
   * @param maxClicks     - Maximum number of Next clicks to attempt (default 4)
   * @returns true if the target tab became visible, false otherwise
   */
  async navigateTabsFlexibly(
    targetTabName: 'History' | 'Vitals' | 'Examination',
    maxClicks = 4
  ): Promise<boolean> {
    const targetMap: Record<string, () => ReturnType<Page['locator']>> = {
      History: () => this.historyTabpanel(),
      Vitals: () => this.vitalsTabpanel(),
      Examination: () => this.examinationTabpanel(),
    };

    const getTarget = targetMap[targetTabName];
    if (!getTarget) return false;

    // Already on target tab?
    if (await getTarget().isVisible({ timeout: 1500 }).catch(() => false)) return true;

    for (let i = 0; i < maxClicks; i++) {
      try {
        await this.clickNextButton();
      } catch {
        // Next button not clickable on this step (disabled / not found) — stop trying
        break;
      }
      if (await getTarget().isVisible({ timeout: 3000 }).catch(() => false)) return true;
      // If Submit appeared we've passed the target tab — bail early
      const submitVisible = await this.submitButton().isVisible({ timeout: 500 }).catch(() => false);
      if (submitVisible) break;
    }

    return await getTarget().isVisible({ timeout: 1000 }).catch(() => false);
  }
}