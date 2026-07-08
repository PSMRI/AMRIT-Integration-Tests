/// <reference types="node" />
import { test } from '@playwright/test';
import { execSync } from 'node:child_process';

const testFiles = [
  'tests/01-login.test.ts',
  'tests/02-register.test.ts',
  'tests/03-nurse.test.ts',
  'tests/04-doctor.test.ts',
  'tests/05-lab_doctor.test.ts',
  'tests/06-pharmacist.test.ts'
];

test.describe.serial('Master Test Suite - Run 01 to 06 in order', () => {
  test('TC-MASTER - Execute test files sequentially', async ({}, testInfo) => {
    test.setTimeout(30 * 60 * 1000);

    const activeProject = testInfo.project.name;
    const isHeaded = testInfo.project.use.headless === false;

    for (const testFile of testFiles) {
      console.log(`Running: ${testFile}`);
      try {
        const commandParts = [
          'npx playwright test',
          testFile,
          '--workers=1',
          `--project=${activeProject}`,
          isHeaded ? '--headed' : ''
        ].filter(Boolean);

        execSync(commandParts.join(' '), {
          stdio: 'inherit'
        });
      } catch (error) {
        throw new Error(`Execution failed for ${testFile}: ${String(error)}`);
      }
    }
  });
});
