import { test, expect } from "@playwright/test";
import { login } from "../../helpers/login.js";

test("Login with invalid credentials shows error", async ({ page }) => {
  await page.goto(`${process.env.BASE_URL}/aam`);
  await expect(page.getByLabel("User ID")).toBeVisible();
  await page.getByLabel("User ID").fill("wronguser");
  await page.getByLabel("Password").fill("wrongpass");
  const loginButton = page.getByRole("button", { name: "Login" });
  await expect(loginButton).toBeEnabled();
  await loginButton.click();
  await expect(page.getByText(/Invalid username or password/i)).toBeVisible();
});

test("Login with valid credentials navigates to service", async ({ page }) => {
  await login(page);
  await expect(page).toHaveURL(/#\/service/);
});
