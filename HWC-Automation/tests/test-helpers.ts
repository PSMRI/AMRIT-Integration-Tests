/**
 * Shared test utilities for HWC-Automation.
 */

/**
 * Sanitize a person name for AMRIT's validator which only accepts [A-Za-z\s].
 * Raw faker names can contain apostrophes (O'Brien), hyphens (Lehner-Homenick),
 * or accents (Renée) — all of which permanently disable the Submit button.
 * Sanitize at the point of generation so fillPersonalInfo, fullName, and
 * selectBeneficiary all use the same clean string.
 */
export function sanitizeName(name: string): string {
  return name.replace(/[^A-Za-z\s]/g, '').replace(/\s+/g, ' ').trim() || 'Test';
}
