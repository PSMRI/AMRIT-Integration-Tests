import { test, expect } from "@playwright/test";
import { faker } from "@faker-js/faker";
import { login } from "../../helpers/login.js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

async function clickNext(page) {
  const nextBtn = page
    .getByRole("button", { name: "Next" })
    .filter({ has: page.locator(":visible") });
  await expect(nextBtn).toBeVisible();
  await nextBtn.click();
}

test.describe("Registration and Nurse Flow", () => {
  let beneficiaryId;

  test("Creating the beneficiary", async ({ page }) => {
    await login(page);
    await page.getByRole("button", { name: "Continue" }).click();
     await expect(
      page.getByRole("button", { name: "Registration" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Registration" }).click();
    await page.getByRole("button", { name: "Registration" }).nth(1).click();
    await page.getByRole("button", { name: "ACCEPT" }).click();
    await expect(
      page.getByRole("textbox", { name: /First Name/i }),
    ).toBeVisible();
    await page
      .getByRole("textbox", { name: /First Name/i })
      .fill(faker.person.firstName());
    await page.locator('input[placeholder="Last Name"]').fill(faker.person.lastName());
    await page
      .getByRole("combobox", { name: "Gender" })
      .locator("span")
      .click();
    await page.getByText("Male", { exact: true }).click();
    await page
      .getByRole("combobox", { name: "Age Unit" })
      .locator("span")
      .click();
    await page.getByRole("option", { name: "Years" }).click();
    await page.getByRole("button", { name: "Open calendar" }).click();
    await page.getByRole("button", { name: "Choose month and year" }).click();
    await page.getByRole("button", { name: "2002" }).click();
    await page.getByRole("button", { name: "September" }).click();
    await page.getByRole("button", { name: "September 1," }).click();
    await page
      .getByRole("combobox", { name: "Marital Status" })
      .locator("span")
      .click();
    await page.getByRole("option", { name: "Unmarried" }).click();
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("combobox", { name: "State" }).click();
    await page.getByRole("option", { name: "Assam", exact: true }).click();
    await page.getByRole("combobox", { name: "District" }).click();
    await page.getByRole("option", { name: "Baksa" }).click();
    await page.getByRole("combobox", { name: "Taluk/Tehsil" }).click();
    await page.getByRole("option", { name: "Barama Pt" }).click();
    await page.getByRole("combobox", { name: "village" }).click();
    await page.getByRole("option", { name: "Alagjhar" }).click();
    await page.getByRole("button", { name: "Next" }).click();
    await page
      .getByRole("textbox", { name: "Father Name" })
      .fill(faker.person.firstName());
    await page.getByRole('tabpanel', { name: /Other Information/i })
      .getByRole('button', { name: 'Next' })
      .click();
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByRole("heading", { name: "Success" })).toBeVisible({
      timeout: 10000,
    });
    await page.waitForSelector("div.message", { state: "visible" });
    const successMessage = await page.locator("div.message").textContent();
    const beneficiaryIdMatch = successMessage.match(
      /Beneficiary ID is : (\d+)/,
    );
    beneficiaryId = beneficiaryIdMatch ? beneficiaryIdMatch[1] : null;

    if (!beneficiaryId) {
      throw new Error(
        `Failed to extract beneficiaryId from message: "${successMessage}"`,
      );
    }

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const filePath = path.resolve(__dirname, "../../beneficiary.json");
    try {
      fs.writeFileSync(filePath, JSON.stringify({ beneficiaryId }, null, 2));
    } catch (error) {
      throw new Error(`Failed to write beneficiary.json: ${error.message}`);
    }

    await page.getByRole("button", { name: "OK" }).click();
  });
});
