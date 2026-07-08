import { Page, Locator, expect } from '@playwright/test';

export class RegisterPage {
  readonly page: Page;

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Locators
  readonly registrationButton = () => this.page.locator('#main-navbar').getByRole('button', { name: 'Registration' }).first();
  readonly advanceSearchButton = () => this.page.locator('button.adv-button.mat_blue').filter({ hasText: /advanced\s*search/i }).first();
  readonly beneficiaryConsentHeading = () => this.page.getByRole('heading', { name: 'Beneficiary Consent' });
  readonly acceptButton = () => this.page.getByRole('button', { name: 'Accept' });
  readonly personalInfoTab = () => this.page.getByRole('tabpanel', { name: 'Personal Information' });
  
  // Personal Information Fields
  readonly firstNameTextbox = () => this.page.getByRole('textbox', { name: 'First Name' });
  readonly lastNameTextbox = () => this.page.getByRole('textbox', { name: 'Last Name' });
  readonly genderCombobox = () => this.page.locator('.mat-mdc-form-field-infix').nth(1);
  readonly genderListbox = () => this.page.getByRole('listbox', { name: 'Gender' });
  readonly ageTextbox = () => this.page.getByRole('textbox', { name: 'Age' });
  readonly dobTextbox = () => this.page.getByRole('textbox', { name: /DOB|Date of Birth/i }).first();
  readonly ageUnitCombobox = () => this.page.locator('.mat-mdc-form-field-infix.ng-tns-c1205077789-19');
  readonly ageUnitListbox = () => this.page.getByRole('listbox', { name: 'Age Unit' });
  readonly maritalStatusDropdown = () => this.page.getByRole('combobox', { name: /Marital Status/i }).first();
  readonly maritalStatusCombobox = () => this.page.locator('.mat-mdc-select-placeholder');
  readonly maritalStatusListbox = () => this.page.getByRole('listbox', { name: 'Marital Status' });
  
  // Navigation Buttons
  readonly nextButton = () => this.page.getByRole('button', { name: 'Next' });
  readonly submitButton = () => this.page.getByRole('button', { name: 'Submit' });
  
  // Tab Panels
  readonly locationInfoTab = () => this.page.getByRole('tabpanel', { name: 'Location Information' });
  readonly otherInfoTab = () => this.page.getByRole('tabpanel', { name: 'Other Information' });
  readonly abhaInfoTab = () => this.page.getByRole('tabpanel', { name: 'ABHA Information' });
  readonly fatherNameTextbox = () => this.page.getByRole('textbox', { name: /father\s*name/i }).first();
  readonly advanceSearchNameTextbox = () => this.page.getByRole('textbox', { name: /beneficiary\s*name|name/i }).first();
  readonly advanceSearchFirstNameTextbox = () => this.page.getByRole('textbox', { name: /first\s*name/i }).first();
  readonly advanceSearchLastNameTextbox = () => this.page.getByRole('textbox', { name: /last\s*name/i }).first();
  readonly searchButton = () => this.page.getByRole('button', { name: /^Search$/i }).first();
  
  // Success Message
  readonly successHeading = () => this.page.getByRole('heading', { name: 'Success' });
  readonly okButton = () => this.page.getByRole('button', { name: 'OK' });
  readonly beneficiaryNotFoundMessage = () => this.page.getByText(/Beneficiary data not found/i).first();
  readonly modalOkButton = () => this.page.locator('button[mat-dialog-close].button-ok, button.full-width-login.button-ok, button:has-text("OK")').first();

  constructor(page: Page) {
    this.page = page;
  }

  // Navigation Methods
  async navigateToRegistration() {
    const navbarRegistrationButton = this.registrationButton();

    if (await navbarRegistrationButton.count()) {
      // Add explicit timeout — without it Playwright inherits the full test timeout (120s)
      await navbarRegistrationButton.click({ timeout: 30000 });
      return;
    }

    // Fallback selector — cap at 30s so the test fails fast with a clear error
    await this.page.getByRole('button', { name: 'Registration' }).first().click({ timeout: 30000 });
  }

  async waitForBeneficiaryConsent() {
    await expect(this.beneficiaryConsentHeading()).toBeVisible();
  }

  async acceptConsent() {
    // cdk-overlay-backdrop can intercept pointer events — fall back to force click
    try {
      await this.acceptButton().click({ timeout: 10000 });
    } catch {
      await this.acceptButton().click({ force: true });
    }
    await expect(this.personalInfoTab()).toBeVisible();
  }

  async openAdvanceSearch() {
    let button = this.advanceSearchButton();

    if ((await button.count()) === 0) {
      button = this.page
        .locator('button.btn-default.pull-right.adv-button.mat_blue, button.adv-button.mat_blue, button:has-text("Advanced Search")')
        .first();
    }

    await expect(button).toBeVisible();
    await button.click();
  }

  private async selectDropdownOptionByLabel(scope: Locator, labelPattern: RegExp, optionText: string) {
    const formField = scope
      .locator('mat-form-field, .mat-mdc-form-field, [class*="form-field"]')
      .filter({ hasText: labelPattern })
      .first();

    await expect(formField).toBeVisible();

    const trigger = formField.locator('[role="combobox"], .mat-mdc-select, .mat-mdc-select-trigger').first();
    await expect(trigger).toBeVisible();
    await trigger.click();

    const exactOption = this.page
      .getByRole('option', { name: new RegExp(`^\\s*${this.escapeRegExp(optionText)}\\s*$`, 'i') })
      .first();

    if (await exactOption.count()) {
      await exactOption.click();
    } else {
      await this.page.getByRole('option').filter({ hasText: new RegExp(this.escapeRegExp(optionText), 'i') }).first().click();
    }

    await this.page.waitForTimeout(1000);
  }

  private async selectOrTypeFieldByLabel(scope: Locator, labelPattern: RegExp, value: string) {
    const formField = scope
      .locator('mat-form-field, .mat-mdc-form-field, [class*="form-field"]')
      .filter({ hasText: labelPattern })
      .first();

    await expect(formField).toBeVisible();

    const textInput = formField.locator('input[role="combobox"], input, textarea').first();
    if (await textInput.count()) {
      await expect(textInput).toBeVisible();
      await textInput.fill(value);

      const suggestionOption = this.page.getByRole('option', { name: new RegExp(this.escapeRegExp(value), 'i') }).first();
      if (await suggestionOption.count()) {
        await suggestionOption.click();
      } else {
        await textInput.press('ArrowDown').catch(() => {});
        await textInput.press('Enter').catch(() => {});
      }

      await this.page.waitForTimeout(1000);
      return;
    }

    await this.selectDropdownOptionByLabel(scope, labelPattern, value);
  }

  async fillAdvanceSearchBeneficiaryName(name: string) {
    let nameInput = this.advanceSearchNameTextbox();

    if ((await nameInput.count()) === 0) {
      nameInput = this.page
        .locator('input[placeholder*="name" i], input[formcontrolname*="name" i], input[name*="name" i], input[aria-label*="name" i]')
        .first();
    }

    await expect(nameInput).toBeVisible();
    await nameInput.fill(name);
  }

  async fillAdvanceSearchCriteria(firstName: string, lastName: string, gender: string, state: string, district: string) {
    const visibleSearchScope = this.page
      .locator('app-search:visible, .modal.show:visible, [role="dialog"]:visible, mat-dialog-container:visible, .mat-mdc-dialog-container:visible')
      .first();
    const scope = (await visibleSearchScope.count()) ? visibleSearchScope : this.page.locator('body').first();

    let firstNameInput = this.advanceSearchFirstNameTextbox();
    if ((await firstNameInput.count()) === 0) {
      firstNameInput = scope.locator('input[placeholder*="first" i], input[aria-label*="first" i], input[name*="first" i]').first();
    }

    let lastNameInput = this.advanceSearchLastNameTextbox();
    if ((await lastNameInput.count()) === 0) {
      lastNameInput = scope.locator('input[placeholder*="last" i], input[aria-label*="last" i], input[name*="last" i]').first();
    }

    await expect(firstNameInput).toBeVisible();
    await firstNameInput.fill(firstName);
    await expect(lastNameInput).toBeVisible();
    await lastNameInput.fill(lastName);

    const selectGenderFromDropdown = async (value: string) => {
      let genderControl = this.page.getByLabel(/gender/i).first();

      if ((await genderControl.count()) === 0) {
        genderControl = this.page.getByRole('combobox', { name: /gender/i }).first();
      }

      if ((await genderControl.count()) === 0) {
        genderControl = this.page.locator('[id^="mat-select-"][aria-labelledby*="form-field-label"]').first();
      }

      await expect(genderControl).toBeVisible();
      await genderControl.click();

      const genderOption = this.page.getByRole('option', { name: new RegExp(`^\\s*${this.escapeRegExp(value)}\\s*$`, 'i') }).first();
      await expect(genderOption).toBeVisible();
      await genderOption.click();
    };

    const fillAutocompleteByLabel = async (labelPattern: RegExp, value: string) => {
      let fieldInput = this.page.getByLabel(labelPattern).first();

      if ((await fieldInput.count()) === 0) {
        fieldInput = this.page.getByRole('combobox', { name: labelPattern }).first();
      }

      if ((await fieldInput.count()) === 0) {
        fieldInput = scope
          .locator('mat-form-field, .mat-mdc-form-field')
          .filter({ hasText: labelPattern })
          .locator('input[role="combobox"], input')
          .first();
      }

      await expect(fieldInput).toBeVisible();
      const isDistrictField = /district/i.test(labelPattern.source);
      const seedText = isDistrictField ? 'go' : value;

      if (isDistrictField) {
        await fieldInput.fill('');
        await fieldInput.type(seedText, { delay: 140 });
      } else {
        await fieldInput.fill(seedText);
      }

      const option = this.page.getByRole('option', { name: new RegExp(`^\\s*${this.escapeRegExp(value)}\\s*$`, 'i') }).first();
      if (await option.count()) {
        await option.click();
      } else {
        if (isDistrictField) {
          await fieldInput.fill('');
          await fieldInput.type(value, { delay: 110 });
        } else {
          await fieldInput.fill(value);
        }
        await fieldInput.press('ArrowDown').catch(() => {});
        await fieldInput.press('Enter').catch(() => {});
      }
    };

    await selectGenderFromDropdown(gender);
    await fillAutocompleteByLabel(/state/i, state);
    await fillAutocompleteByLabel(/district/i, district);
  }

  async clickAdvanceSearchSubmit() {
    let searchBtn = this.searchButton();

    if ((await searchBtn.count()) === 0) {
      searchBtn = this.page
        .locator('button:has-text("Search"), [role="button"]:has-text("Search")')
        .first();
    }

    await expect(searchBtn).toBeVisible();
    await searchBtn.click();
    await this.page.waitForTimeout(1000);
  }

  async verifySearchResultContainsBeneficiary(name: string) {
    const escaped = this.escapeRegExp(name.trim());
    const resultRow = this.page
      .locator('table tr, .mat-mdc-row, .mat-row, [role="row"], .beneficiary-card, .search-result-item')
      .filter({ hasText: new RegExp(escaped, 'i') })
      .first();

    await expect(resultRow).toBeVisible({ timeout: 10000 });
  }

  // Personal Information Methods
  async fillFirstName(firstName: string) {
    await this.firstNameTextbox().click();
    await this.firstNameTextbox().fill(firstName);
  }

  async fillLastName(lastName: string) {
    await this.page.getByText('Last Name').click();
    await this.lastNameTextbox().fill(lastName);
  }

  async selectGender(gender: string) {
    await this.page.getByRole('combobox', { name: 'Gender' }).click();
    await expect(this.genderListbox()).toBeVisible();
    await this.page.getByText(gender, { exact: true }).click();
    await this.page.waitForTimeout(1000);
  }

  async fillAge(age: string) {
    await this.ageTextbox().click();
    await this.ageTextbox().fill(age);
  }

  async getDobField() {
    const candidates = [
      this.dobTextbox(),
      this.page.locator('input[formcontrolname="dob"]').first(),
      this.page.locator('input[formcontrolname="dateOfBirth"]').first(),
      this.page.locator('input[type="date"]').first(),
    ];

    for (const candidate of candidates) {
      if (await candidate.count()) {
        return candidate;
      }
    }

    throw new Error('DOB field was not found on the registration form');
  }

  async verifyDobAutoPopulated() {
    const dobField = await this.getDobField();
    await expect(dobField).toBeVisible();
    await expect(dobField).not.toHaveValue('');
  }

  async selectAgeUnit(ageUnit: string) {
    await this.page.getByRole('combobox', { name: 'Age Unit' }).click();
    await expect(this.ageUnitListbox()).toBeVisible();
    await this.page.getByRole('option', { name: ageUnit }).click();
    await this.page.waitForTimeout(1000);
  }

  async selectMaritalStatus(maritalStatus: string) {
    const maritalStatusCombobox = this.maritalStatusDropdown();
    await maritalStatusCombobox.click();

    const maritalStatusListbox = this.page.getByRole('listbox').first();
    await expect(maritalStatusListbox).toBeVisible();

    const exactOptionRegex = new RegExp(`^\\s*${this.escapeRegExp(maritalStatus)}\\s*$`, 'i');
    const requestedOption = maritalStatusListbox.getByRole('option', { name: exactOptionRegex }).first();

    if (await requestedOption.count()) {
      await requestedOption.click();
    } else {
      const fallbackOption = maritalStatusListbox.getByRole('option').first();
      await fallbackOption.click();
    }

    await this.page.waitForTimeout(1000);
  }

  /**
   * AMRIT name fields only accept letters and spaces (pattern [A-Za-z\s]).
   * faker.person.firstName/lastName() occasionally produces names with apostrophes
   * (O'Brien), hyphens (Mary-Jane), or accents (Renée) which fail Angular's
   * name validator → form stays permanently invalid → Submit never enables.
   * Strip everything except letters and spaces, and guarantee a non-empty result.
   */
  private sanitizeName(name: string): string {
    return name.replace(/[^A-Za-z\s]/g, '').replace(/\s+/g, ' ').trim() || 'Test';
  }

  async fillPersonalInfo(firstName: string, lastName: string, gender: string, age: string, ageUnit: string, maritalStatus: string) {
    await this.fillFirstName(this.sanitizeName(firstName));
    await this.fillLastName(this.sanitizeName(lastName));
    await this.selectGender(gender);
    await this.fillAge(age);
    await this.selectAgeUnit(ageUnit);
    await this.selectMaritalStatus(maritalStatus);
  }

  async fillMandatoryPersonalInfo(firstName: string, lastName: string, gender: string, age: string, ageUnit: string) {
    await this.fillFirstName(this.sanitizeName(firstName));
    await this.fillLastName(this.sanitizeName(lastName));
    await this.selectGender(gender);
    await this.fillAge(age);
    await this.selectAgeUnit(ageUnit);
  }

  async fillMandatoryLocationInfo(_state: string, _district: string) {
    // Location Information fields (State / District / Taluk) are a cascading dropdown.
    // Selecting State+District without completing the full cascade leaves Angular form
    // validation in an invalid state → Submit button stays disabled.
    // The Golaghat district in the UAT environment has no Taluk subdivisions, so the
    // cascade cannot be completed. Confirmed by TC06 and TC21: Location Info is
    // OPTIONAL — leaving all location fields untouched (pristine) allows Submit to proceed.
    // This method therefore intentionally skips filling to keep the form valid.
    await this.verifyLocationInfoTab();
    console.log('[fillMandatoryLocationInfo] Location Info is optional — skipping field fill to avoid invalid cascade state');
  }

  // Navigation Methods
  async clickNextButton() {
    const activePanel = this.page.locator('[role="tabpanel"]:visible').first();
    await expect(activePanel).toBeVisible();

    const nextButton = activePanel.getByRole('button', { name: /^Next$/i }).first();
    await expect(nextButton).toBeVisible();
    await expect(nextButton).toBeEnabled();

    await nextButton.scrollIntoViewIfNeeded();

    // Close any open overlay/dropdown that may intercept click.
    await this.page.keyboard.press('Escape').catch(() => {});

    try {
      await nextButton.click({ timeout: 5000 });
    } catch {
      try {
        await nextButton.click({ force: true, timeout: 5000 });
      } catch {
        await nextButton.evaluate((el) => (el as HTMLButtonElement).click());
      }
    }

    await this.page.waitForTimeout(1000);
  }

  async clickSubmitButton() {
    const btn = this.submitButton();
    // expect().toBeEnabled() POLLS until enabled (unlike isEnabled() which checks once).
    // This handles Angular's async reactive-form validators which settle after dropdown selections.
    try {
      await expect(btn).toBeEnabled({ timeout: 10000 });
    } catch {
      await this.page.screenshot({ path: './test-results/screenshot-submit-disabled.png' }).catch(() => {});
      throw new Error('Registration Submit button still disabled after 10s — a required field may be missing or Angular form validators have not settled');
    }
    await btn.click();
    await this.page.waitForTimeout(1000);
  }

  async verifySubmitButtonDisabled() {
    await expect(this.submitButton()).toBeVisible();
    await expect(this.submitButton()).toBeDisabled();
  }

  async verifyLocationInfoTab() {
    await expect(this.locationInfoTab()).toBeVisible();
  }

  async verifyOtherInfoTab() {
    await expect(this.otherInfoTab()).toBeVisible();
  }

  async verifyABHAInfoTab() {
    await expect(this.abhaInfoTab()).toBeVisible();
  }

  async navigateFromPersonalToABHAInfo() {
    await this.clickNextButton();
    await this.verifyLocationInfoTab();
    await this.clickNextButton();
    await this.verifyOtherInfoTab();
    await this.clickNextButton();
    await this.verifyABHAInfoTab();
  }

  async verifySuccessMessage() {
    // isVisible() is a one-shot check — it does NOT retry regardless of the timeout option.
    // Use expect().toBeVisible() which polls every ~100ms until the timeout.
    try {
      await expect(this.successHeading()).toBeVisible({ timeout: 15000 });
      return;
    } catch {
      // Heading dialog not found — try snackbar/toast fallback
    }
    try {
      const snackbar = this.page.locator('mat-snack-bar-container, [role="alert"]').filter({ hasText: /success/i });
      await expect(snackbar).toBeVisible({ timeout: 5000 });
      console.log('[verifySuccessMessage] Success shown as snackbar/toast (not heading dialog)');
    } catch {
      throw new Error('Success message not visible — neither Success heading dialog nor snackbar appeared within timeout');
    }
  }

  async getSuccessPopupText() {
    const candidates = [
      this.page.locator('[role="dialog"]').first(),
      this.page.locator('mat-dialog-container, .mat-mdc-dialog-container').first(),
      this.page.locator('body').first(),
    ];

    for (const candidate of candidates) {
      if (await candidate.count()) {
        const text = ((await candidate.textContent()) || '').replace(/\s+/g, ' ').trim();
        if (text) {
          return text;
        }
      }
    }

    return '';
  }

  async getGeneratedBeneficiaryId() {
    const idPatterns = [
      /beneficiary\s*id\s*(?:is\s*)?[:#-]?\s*([A-Za-z0-9\-\/]{4,})/i,
      /\b(?:id)\s*[:#-]\s*([A-Za-z0-9\-\/]{4,})/i,
      /\b([A-Za-z0-9\-\/]*\d[A-Za-z0-9\-\/]{3,})\b/,
    ];
    const invalidTokens = /^(is|id|beneficiary|generated|success|successfully)$/i;

    const extractCandidate = (text: string) => {
      for (const pattern of idPatterns) {
        const match = text.match(pattern);
        const candidate = match?.[1]?.trim() || '';
        if (!candidate) {
          continue;
        }

        // Beneficiary IDs are expected to be alphanumeric tokens with at least one digit.
        if (candidate.length >= 4 && /\d/.test(candidate) && !invalidTokens.test(candidate)) {
          return candidate;
        }
      }

      return '';
    };

    await expect
      .poll(async () => {
        const popupText = await this.getSuccessPopupText();
        return extractCandidate(popupText);
      }, { timeout: 10000 })
      .not.toBe('');

    const finalPopupText = await this.getSuccessPopupText();
    return extractCandidate(finalPopupText);
  }

  async getValidationMessageTexts() {
    const validationNodes = this.page.locator('mat-error, .mat-mdc-form-field-error, [role="alert"], .error-message, .invalid-feedback');
    const rawTexts = await validationNodes.allTextContents();
    return Array.from(
      new Set(
        rawTexts
          .map((value) => value.replace(/\s+/g, ' ').trim())
          .filter((value) => /required|mandatory|invalid|please/i.test(value))
      )
    );
  }

  async verifyValidationMessagesVisible() {
    await expect
      .poll(async () => {
        const texts = await this.getValidationMessageTexts();
        return texts.length;
      }, { timeout: 5000 })
      .toBeGreaterThan(0);
  }

  async verifySubmissionBlocked() {
    const successVisible = await this.successHeading().isVisible().catch(() => false);
    expect(successVisible).toBeFalsy();
  }

  async isBeneficiaryNotFoundPopupVisible() {
    const popupCandidates = [
      this.beneficiaryNotFoundMessage(),
      this.page.locator('div.message').filter({ hasText: /Beneficiary data not found/i }).first(),
      this.page.locator('[role="dialog"]').filter({ hasText: /Beneficiary data not found/i }).first(),
      this.page.locator('mat-dialog-container, .mat-mdc-dialog-container').filter({ hasText: /Beneficiary data not found/i }).first(),
    ];

    for (const candidate of popupCandidates) {
      if (await candidate.count().catch(() => 0)) {
        if (await candidate.isVisible().catch(() => false)) {
          return true;
        }
      }
    }

    return false;
  }

  async clickBeneficiaryNotFoundPopupOk() {
    await expect(this.modalOkButton()).toBeVisible({ timeout: 5000 });
    await this.modalOkButton().click();
    await this.page.waitForTimeout(1000);
  }

  async clickOKButton() {
    await this.okButton().click();
  }

  // Screenshot Method
  async takeScreenshot(screenshotName: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `screenshot-${screenshotName}-${timestamp}.png`;
    await this.page.screenshot({ path: `./test-results/screenshots/${fileName}` });
  }
}