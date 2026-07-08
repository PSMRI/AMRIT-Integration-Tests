/// <reference types="node" />
import { defineConfig, devices } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Auto-load .env file if present
try {
  const envPath = new URL('.env', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) process.env[match[1].trim()] = match[2].trim();
    }
  }
} catch { /* ignore */ }

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const qaseToken = process.env.QASE_API_TOKEN || process.env.QASE_TESTOPS_API_TOKEN;

// Ensure screenshots directory exists
const screenshotsDir = path.join(__dirname, 'test-results/screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

export default defineConfig({
  testDir: './tests',
  timeout: 120000,
  expect: {
    timeout: 15000,
  },

  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,

  reporter: [
    ['list'],
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ...(qaseToken
      ? [
          [
            'playwright-qase-reporter',
            {
              mode: 'testops',
              debug: false,
              testops: {
                api: {
                  token: qaseToken,
                },
                project: 'AR',
                run: {
                  complete: true,
                  title: 'HWC-Automation Run ' + new Date().toISOString().slice(0, 10),
                  description: 'Automated regression run for HWC-Automation suite',
                },
                plan: {
                  id: undefined,
                },
                uploadAttachments: true,
              },
            },
          ] as const,
        ]
      : []),
  ],

  use: {
    baseURL: 'https://uatamrit.piramalswasthya.org',
    trace: 'on-first-retry',
    screenshot: 'on',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});