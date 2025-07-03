import { test, expect } from '@playwright/test';

test('Login with invalid credentials shows error', async ({ page }) => {
  await page.goto(`${process.env.BASE_URL}/aam`, { waitUntil: 'networkidle' });
  await page.fill('#userID', 'wronguser');
  await page.fill('#password', 'wrongpass');

  const loginButton = page.getByRole('button', { name: 'Login' });
  await expect(loginButton).toBeEnabled({ timeout: 10000 });
  await loginButton.click();

  await expect(page.getByText(/User login failed due to/i)).toBeVisible({ timeout: 5000 });
});

test('Login with valid credentials shows already logged in message', async ({ page }) => {
  await page.goto(`${process.env.BASE_URL}/aam`, { waitUntil: 'networkidle' });
  await page.fill('#userID', process.env.AAM_USERNAME);
  await page.fill('#password', process.env.AAM_PASSWORD);

  const loginButton = page.getByRole('button', { name: 'Login' });
  await expect(loginButton).toBeEnabled({ timeout: 10000 });
  await loginButton.click();
  const alreadyLoggedInText = page.getByText(/You are already logged in,/i);
  try {
    await expect(alreadyLoggedInText).toBeVisible({ timeout: 3000 });
    await page.getByRole('button', { name: 'OK' }).click();
  }
  catch (error) {
    console.log('No popup appeared or other error: ', error.message);
  }
  await page.waitForURL('**/service', { timeout: 7000 });
  await expect(page).toHaveURL(/\/service$/);
});




