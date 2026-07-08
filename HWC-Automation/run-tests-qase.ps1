# HWC-Automation - Run all tests and push results to Qase (project: AR / AMRIT_Regression)
# Run this from PowerShell: .\run-tests-qase.ps1
# Set $env:QASE_API_TOKEN before running, e.g.: $env:QASE_API_TOKEN = "your_token_here"

if (-not $env:QASE_API_TOKEN) {
    Write-Host "ERROR: QASE_API_TOKEN is not set. Run: `$env:QASE_API_TOKEN = 'your_token_here'" -ForegroundColor Red
    exit 1
}

Set-Location $PSScriptRoot

Write-Host "Installing Playwright browsers..." -ForegroundColor Cyan
npx playwright install chromium

Write-Host ""
Write-Host "Running all HWC-Automation tests on Chromium..." -ForegroundColor Cyan
Write-Host "Results will be pushed to Qase project AR (AMRIT_Regression), suite HWC-Automation" -ForegroundColor Cyan
Write-Host ""

npx playwright test `
  tests/01-login.test.ts `
  tests/02-register.test.ts `
  tests/03-nurse.test.ts `
  tests/04-doctor.test.ts `
  tests/05-lab_doctor.test.ts `
  tests/06-pharmacist.test.ts `
  --project=chromium `
  --reporter=list

Write-Host ""
Write-Host "Done. Check Qase for results: https://app.qase.io/project/AR" -ForegroundColor Green
