import { expect } from '@playwright/test';

/**
 * Logs into the AAM application on the provided Playwright page using credentials from environment variables.
 *
 * Navigates to the AAM entry point derived from BASE_URL, fills the username and password from AAM_USERNAME and AAM_PASSWORD, submits the login form, handles a possible "You are already logged in" dialog by confirming it, and verifies post-login state by asserting the URL contains "/#/service" and a visible "Continue" button.
 *
 * @param {import('@playwright/test').Page} page - Playwright Page used for navigation and interactions.
 * @throws {Error} If any of BASE_URL, AAM_USERNAME, or AAM_PASSWORD environment variables are missing.
 */
export async function login(page) {
  const { BASE_URL, AAM_USERNAME, AAM_PASSWORD } = process.env;
  if (!BASE_URL || !AAM_USERNAME || !AAM_PASSWORD) {
    throw new Error('Missing required env vars: BASE_URL, AAM_USERNAME, AAM_PASSWORD');
  }

  const url = new URL('aam', BASE_URL);
  await page.goto(url.href);
  await page.waitForSelector('#userID');
  await page.fill('#userID', AAM_USERNAME);
  await page.fill('#password', AAM_PASSWORD);

  const loginButton = page.getByRole('button', { name: 'Login' });
  await expect(loginButton).toBeEnabled({ timeout: 10000 });
  await loginButton.click();

  const alreadyLoggedInText = page.getByText(/You are already logged in/i);
  try {
       await alreadyLoggedInText.waitFor({ state: 'visible', timeout: 3000 });
       await page.getByRole('dialog').getByRole('button', { name: /^OK$/i }).click();
      } catch {}

  await expect(page).toHaveURL(/#\/service/);
  await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
}
