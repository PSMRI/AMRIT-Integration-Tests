import { expect, Page } from '@playwright/test';

export class PharmacistPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  private normalize(value?: string): string {
    return (value || '').replace(/\s+/g, ' ').trim();
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private async getBeneficiaryNameFromFile(): Promise<string | undefined> {
    try {
      const fs: any = await (0, eval)("import('node:fs/promises')");
      const content = await fs.readFile('./data/lastBeneficiary.json', 'utf8');
      const name = JSON.parse(content)?.name;
      return this.normalize(name) || undefined;
    } catch {
      return undefined;
    }
  }

  private async clickOk(timeout: number = 10000, required: boolean = true): Promise<boolean> {
    const started = Date.now();

    while (Date.now() - started < timeout) {
      const candidates = [
        this.page.locator('mat-dialog-container button.button-ok').last(),
        this.page.locator('mat-dialog-container button[mat-dialog-close]').last(),
        this.page.locator('button.button-ok', { hasText: /^\s*OK\s*$/i }).last(),
        this.page.getByRole('button', { name: /^OK$/i }).last(),
        this.page.locator('button', { hasText: /^\s*OK\s*$/i }).last()
      ];

      for (const candidate of candidates) {
        try {
          // Check if visible AND enabled (not disabled)
          const isVisible = await candidate.isVisible({ timeout: 250 }).catch(() => false);
          const isDisabled = await candidate.isDisabled().catch(() => false);
          
          if (isVisible && !isDisabled) {
            await candidate.scrollIntoViewIfNeeded().catch(() => {});
            // Wait for element to be stable before clicking
            await candidate.waitFor({ state: 'visible', timeout: 1000 }).catch(() => {});
            await this.page.waitForTimeout(300);
            await candidate.click({ timeout: 5000 });
            await this.page.waitForTimeout(500);
            return true;
          }
        } catch (e) {
          // Continue to next candidate
        }
      }

      await this.page.waitForTimeout(300);
    }

    if (required) {
      throw new Error('OK button did not appear within timeout in Pharmacist flow');
    }

    return false;
  }

  private async selectBeneficiary(preferredName?: string): Promise<string> {
    const desired = this.normalize(preferredName);
    const searchBox = this.page.getByRole('searchbox', { name: 'In-Table Search' }).first();

    if (desired && await searchBox.count()) {
      await searchBox.fill(desired);
      await this.page.waitForTimeout(700);
    }

    if (desired) {
      const fullMatch = this.page.getByRole('cell').filter({ hasText: new RegExp(`\\b${this.escapeRegex(desired)}\\b`, 'i') }).first();
      if (await fullMatch.count()) {
        await fullMatch.scrollIntoViewIfNeeded();
        await fullMatch.click();
        return desired;
      }

      const firstName = desired.split(' ')[0];
      if (firstName) {
        const partial = this.page.getByRole('cell').filter({ hasText: new RegExp(`\\b${this.escapeRegex(firstName)}\\b`, 'i') }).first();
        if (await partial.count()) {
          await partial.scrollIntoViewIfNeeded();
          await partial.click();
          const clicked = this.normalize((await partial.textContent()) ?? undefined);
          return clicked || desired;
        }
      }
    }

    const firstRowCell = this.page.locator('tbody tr td').first();
    await expect(firstRowCell).toBeVisible({ timeout: 15000 });
    const picked = this.normalize((await firstRowCell.textContent()) ?? undefined) || desired || 'Unknown Beneficiary';
    await firstRowCell.click();
    return picked;
  }

  async completePharmacistFlowAfterPharmaDoctor() {
    const beneficiaryName = await this.getBeneficiaryNameFromFile();

    // Explicit timeout — without it Playwright inherits the full test timeout (300s)
    // and hangs if the button is momentarily behind an overlay from prior navigation.
    await this.page.getByRole('button', { name: 'Pharmacist' }).click({ timeout: 30000 });
    await this.selectBeneficiary(beneficiaryName);
    
    // Wait for dialog to appear after beneficiary selection
    await this.page.waitForSelector('mat-dialog-container', { timeout: 5000 }).catch(() => {});
    await this.page.waitForTimeout(500);
    
    await this.clickOk();

    await this.page.getByRole('button', { name: 'Submit' }).click({ timeout: 30000 });
    
    // Wait for dialog after submit
    await this.page.waitForSelector('mat-dialog-container', { timeout: 5000 }).catch(() => {});
    await this.page.waitForTimeout(500);
    
    await this.clickOk();
    await this.clickOk(4000, false);

    const backToPharmacist = await this.page.getByRole('button', { name: 'Pharmacist' }).isVisible({ timeout: 8000 }).catch(() => false);
    if (!backToPharmacist) {
      console.log('[Pharmacist] Pharmacist button not visible after submit — flow may have navigated away');
    }
  }
}