# HWC-Automation Full Suite Runner
# Runs all test cases and reports results to Qase automatically

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  HWC-Automation Test Suite" -ForegroundColor Cyan
Write-Host "  Qase Project: AR (AMRIT_Regression)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Load QASE_API_TOKEN from .env file (never commit secrets to source control)
if (Test-Path ".env") {
  Get-Content ".env" | ForEach-Object {
    if ($_ -match "^QASE_API_TOKEN=(.+)$") {
      $env:QASE_API_TOKEN = $Matches[1].Trim()
    }
  }
}

Write-Host "Starting test run..." -ForegroundColor Yellow
Write-Host "Results will be reported to Qase as: HWC-Automation Run $(Get-Date -Format 'yyyy-MM-dd')" -ForegroundColor Yellow
Write-Host ""

# Run all tests on Chromium only, excluding the 07-e2e master suite
npx playwright test --project=chromium --ignore-glob "**/07-e2e*"

$exitCode = $LASTEXITCODE

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
if ($exitCode -eq 0) {
    Write-Host "  All tests passed!" -ForegroundColor Green
} else {
    Write-Host "  Some tests failed. Check test-results/ for details." -ForegroundColor Red
}
Write-Host "  HTML Report: test-results/index.html" -ForegroundColor Cyan
Write-Host "  Qase Run: https://app.qase.io/run/AR" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Open HTML report
Start-Process "npx" -ArgumentList "playwright show-report" -NoNewWindow

exit $exitCode
