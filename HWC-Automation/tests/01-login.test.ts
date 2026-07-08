import { test, expect, Page } from '@playwright/test';
import { qase } from 'playwright-qase-reporter';
import { LoginPage } from '../pages/login';

test(qase(655, 'TC01 - Positive Test: Valid Login'), async ({ page }: { page: Page }) => {
  const loginPage = new LoginPage(page);
  
  await loginPage.navigateTo();
  await loginPage.takeScreenshot('TC01-login-page-loaded');
  
  await loginPage.login('Mokrong', 'Test@123');
  await loginPage.takeScreenshot('TC01-after-login');
  
  await page.waitForTimeout(6000);
  await loginPage.takeScreenshot('TC01-final-state');
});

test(qase(657, 'TC02 - Negative Test: Blank Username and Password'), async ({ page }: { page: Page }) => {
  const loginPage = new LoginPage(page);
  
  await loginPage.navigateTo();
  await loginPage.takeScreenshot('TC02-login-page-loaded');
  
  await loginPage.verifyLogoVisibility();
  
  // Check if login button is disabled when fields are blank
  const isDisabled = await loginPage.isLoginButtonDisabled();
  await loginPage.takeScreenshot('TC02-blank-fields-button-state');
  expect(isDisabled).toBe(true);
});

test('TC03 - Negative Test: Only Username Provided', async ({ page }: { page: Page }) => {
  const loginPage = new LoginPage(page);
  
  await loginPage.navigateTo();
  await loginPage.takeScreenshot('TC03-login-page-loaded');
  
  await loginPage.verifyLogoVisibility();
  await loginPage.enterUsername('Mokrong');
  await loginPage.takeScreenshot('TC03-only-username-filled');
  
  // Check if login button is disabled when password is blank
  const isDisabled = await loginPage.isLoginButtonDisabled();
  await loginPage.takeScreenshot('TC03-button-disabled-check');
  expect(isDisabled).toBe(true);
});

test('TC04 - Negative Test: Only Password Provided', async ({ page }: { page: Page }) => {
  const loginPage = new LoginPage(page);
  
  await loginPage.navigateTo();
  await loginPage.takeScreenshot('TC04-login-page-loaded');
  
  await loginPage.verifyLogoVisibility();
  await loginPage.enterPassword('Test@123');
  await loginPage.takeScreenshot('TC04-only-password-filled');
  
  // Check if login button is disabled when username is blank
  const isDisabled = await loginPage.isLoginButtonDisabled();
  await loginPage.takeScreenshot('TC04-button-disabled-check');
  expect(isDisabled).toBe(true);
});

test(qase(656, 'TC05 - Negative Test: Invalid Credentials'), async ({ page }: { page: Page }) => {
  const loginPage = new LoginPage(page);
  
  await loginPage.navigateTo();
  await loginPage.takeScreenshot('TC05-login-page-loaded');
  
  await loginPage.verifyLogoVisibility();
  await loginPage.enterUsername('InvalidUser@123');
  await loginPage.enterPassword('InvalidPassword@123');
  await loginPage.takeScreenshot('TC05-invalid-credentials-filled');
  
  await loginPage.clickLoginButton();
  await loginPage.takeScreenshot('TC05-after-click-login');
  
  // Wait for error message to appear
  await page.waitForTimeout(2000);
  
  // Verify error message is displayed
  const isErrorDisplayed = await loginPage.isErrorMessageDisplayed();
  await loginPage.takeScreenshot('TC05-error-message-displayed');
  expect(isErrorDisplayed).toBe(true);
  
  // Optionally verify error message content
  const errorMessage = await loginPage.getErrorMessage();
  expect(errorMessage).toBeTruthy();
});

test(qase(710, 'TC06 - Logout After Successful Login'), async ({ page }: { page: Page }) => {
  const loginPage = new LoginPage(page);
  
  // Step 1: Navigate and perform successful login
  await loginPage.navigateTo();
  await loginPage.takeScreenshot('TC06-login-page-loaded');
  
  await loginPage.login('Mokrong', 'Test@123');
  await loginPage.takeScreenshot('TC06-after-successful-login');
  
  await page.waitForTimeout(2000);
  
  // Step 2: Perform logout
  await loginPage.clickLogoutButton();
  await loginPage.takeScreenshot('TC06-after-logout-click');
  
  await page.waitForTimeout(1000);
  
  // Step 3: Click close button on the confirmation dialog
  await loginPage.clickCloseButton();
  await loginPage.takeScreenshot('TC06-after-close-click');
  
  // Step 4: Verify we're back on the login page
  await loginPage.verifyLoginPageDisplayed();
  await loginPage.takeScreenshot('TC06-logout-complete-on-login-page');
});

test(qase(711, 'TC07 - Verify Login Page URL and Field Labels'), async ({ page }: { page: Page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.navigateTo();
  await loginPage.takeScreenshot('TC07-login-page-loaded');

  await expect(page).toHaveURL(/uatamrit\.piramalswasthya\.org\/aam\/?/i);

  const usernameLabel = page.locator('mat-label.mat-label-text', { hasText: /^\s*Enter User Name\s*$/ }).first();
  const passwordLabel = page.locator('mat-label.mat-label-text', { hasText: /^\s*Enter Password\s*$/ }).first();
  const usernameInput = page.locator('input[formcontrolname="userName"]').first();
  const passwordInput = page.locator('input[formcontrolname="password"]').first();

  await expect(usernameLabel).toBeVisible();
  await expect(passwordLabel).toBeVisible();
  await expect(usernameInput).toBeVisible();
  await expect(passwordInput).toBeVisible();
  await expect(usernameLabel).toHaveText('Enter User Name');
  await expect(passwordLabel).toHaveText('Enter Password');

  await loginPage.takeScreenshot('TC07-label-validation');
});
