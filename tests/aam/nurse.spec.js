import { test, expect } from "@playwright/test";
import { login } from "../../helpers/login.js";
import { fileURLToPath } from "url";
import * as path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import * as fs from "fs";

test("Nurse provides consultation to the beneficiary", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: "Continue" }).click();

  const filePath = path.resolve(__dirname, "../../beneficiary.json");
  let beneficiaryData;
  try {
    beneficiaryData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (error) {
    throw new Error(`Failed to read beneficiary.json: ${error.message}`);
  }

  const { beneficiaryId } = beneficiaryData;
  if (!beneficiaryId) {
    throw new Error("beneficiaryId is missing in beneficiary.json");
  }

  await page
    .getByRole("searchbox", { name: "In-Table Search" })
    .fill(beneficiaryId);
  await page.getByRole("button", { name: "search" }).click();

  await expect(page.locator("table")).toBeVisible();
  await expect(
    page.getByRole("cell", { name: String(beneficiaryId) }),
  ).toBeVisible();
  await page.getByRole("cell", { name: String(beneficiaryId) }).click();

  const okButton = page.getByRole("button", { name: "OK" });
  await expect(okButton).toBeVisible();
  await expect(okButton).toBeEnabled();
  await okButton.click();

  await expect(page.getByLabel("Reason for Visit")).toBeVisible();
  await page.getByLabel("Reason for Visit").click();
  await page.getByRole("option", { name: "New Chief Complaint" }).click();

  await expect(page.getByLabel("Visit Category")).toBeVisible();
  await page.getByLabel("Visit Category").click();
  await page.getByRole("option", { name: "General OPD (QC)" }).click();

  await page.getByRole("button", { name: "Chief Complaints" }).click();
  await expect(
    page.getByRole("combobox", { name: "Chief Complaints" }),
  ).toBeVisible();

  await page.getByRole("combobox", { name: "Chief Complaints" }).click();
  await page
    .getByRole("combobox", { name: "Chief Complaints" })
    .pressSequentially("fev");
  await expect(page.getByRole("option", { name: "Fever" })).toBeVisible();
  await page.getByRole("option", { name: "Fever" }).click();
  await page.getByRole("textbox", { name: "Duration" }).click();
  await page.getByRole("textbox", { name: "Duration" }).fill("5");
  await page
    .getByRole("combobox", { name: "Unit Of Duration" })
    .locator("span")
    .click();
  await page.getByText("Day(s)").click();
  await page.getByRole("button", { name: "Add" }).click();

  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.getByRole("textbox", { name: "Height(cm)" })).toBeVisible();
  await page.getByRole("textbox", { name: "Height(cm)" }).fill("172");
  await page.getByRole("textbox", { name: "Weight(kg)" }).fill("45");
  await page.getByRole("textbox", { name: "BMI" }).click();

  await expect(page.getByRole("textbox", { name: "BMI" })).toHaveValue(/\d+/);

  await page.getByRole("button", { name: "Vitals" }).click();

  await page.getByRole("textbox", { name: "Temperature(F)" }).fill("97");
  await page.getByRole("textbox", { name: "Pulse Rate(per min)" }).fill("88");
  await page.getByRole("textbox", { name: "SPO2 (%)" }).fill("96");
  await page.getByRole("textbox", { name: "BP (mmHg) Systolic" }).fill("90");
  await page.getByRole("textbox", { name: "BP (mmHg) Diastolic" }).fill("78");
  await page
    .getByRole("textbox", { name: "Respiratory Rate(per min)" })
    .fill("18");

  await expect(page.getByRole("button", { name: "Submit" })).toBeVisible();
  await page.getByRole("button", { name: "Submit" }).click();

  await expect(page.getByText("Data Saved successfully")).toBeVisible({
    timeout: 10000,
  });
});
