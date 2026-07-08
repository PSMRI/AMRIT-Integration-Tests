import { Page, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly baseURL = 'https://uatamrit.piramalswasthya.org/aam/';

  // Locators
  readonly logoImg = () => this.page.getByRole('img', { name: 'Logo' });
  readonly userNameTextbox = () => this.page.getByRole('textbox', { name: 'User Name' });
  readonly passwordTextbox = () => this.page.getByRole('textbox', { name: 'Enter Password' });
  readonly loginButton = () => this.page.getByRole('button', { name: 'Login' });
  readonly okButton = () => this.page.getByRole('button', { name: 'OK' });
  readonly continueButton = () => this.page.getByRole('button', { name: 'Continue' });

  constructor(page: Page) {
    this.page = page;
  }

  // Methods
  async navigateTo() {
    await this.page.goto(this.baseURL);
  }

  async verifyLogoVisibility() {
    await expect(this.logoImg()).toBeVisible();
  }

  async enterUsername(username: string) {
    await this.userNameTextbox().click();
    await this.userNameTextbox().fill(username);
  }

  async enterPassword(password: string) {
    await this.passwordTextbox().click();
    await this.passwordTextbox().fill(password);
  }

  async clickLoginButton() {
    await this.loginButton().click();
  }

  async handleOKButtonIfPresent() {
    try {
      await this.okButton().click({ timeout: 5000 });
      await this.page.waitForLoadState('networkidle');
    } catch {
      // OK button not found, proceeding to next step
    }
  }

  async clickContinueButton() {
    await this.continueButton().click();
  }

  async login(username: string, password: string) {
    await this.navigateTo();
    await this.verifyLogoVisibility();
    await this.enterUsername(username);
    await this.enterPassword(password);
    await this.clickLoginButton();
    await this.handleOKButtonIfPresent();
    await this.clickContinueButton();
  }

  async isLoginButtonDisabled() {
    return await this.loginButton().isDisabled();
  }

  async clearFields() {
    await this.userNameTextbox().clear();
    await this.passwordTextbox().clear();
  }

  async getErrorMessage() {
    // Look for the specific error message text
    const errorElement = this.page.locator('text=Invalid username or password');
    return await errorElement.textContent();
  }

  async isErrorMessageDisplayed() {
    const errorElement = this.page.locator('text=Invalid username or password');
    return await errorElement.isVisible().catch(() => false);
  }

  async takeScreenshot(screenshotName: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `screenshot-${screenshotName}-${timestamp}.png`;
    await this.page.screenshot({ path: `./test-results/screenshots/${fileName}` });
  }

  async clickLogoutButton() {
    // Click on the logout button (power_settings_new icon)
    const logoutIcon = this.page.locator('mat-icon[class*="material-icons"]', { hasText: 'power_settings_new' }).first();
    await logoutIcon.click();
    await this.page.waitForTimeout(1000);
  }

  async clickCloseButton() {
    // Click on the Close button
    const closeButton = this.page.locator('button.fb-btn.fb-btn-cls', { hasText: 'Close' }).first();
    await closeButton.click();
    await this.page.waitForTimeout(1000);
  }

  async verifyLoginPageDisplayed() {
    // Verify we're back on the login page by checking for logo and login form elements
    await expect(this.logoImg()).toBeVisible({ timeout: 10000 });
    await expect(this.userNameTextbox()).toBeVisible();
    await expect(this.passwordTextbox()).toBeVisible();
    await expect(this.loginButton()).toBeVisible();
  }

  async logout() {
    await this.clickLogoutButton();
    await this.clickCloseButton();
    await this.verifyLoginPageDisplayed();
  }
}
