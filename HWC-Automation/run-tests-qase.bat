@echo off
REM HWC-Automation - Run all tests and push results to Qase
REM Double-click this file or run from cmd inside the HWC-Automation folder

cd /d "%~dp0"

rem ── Load QASE_API_TOKEN from .env ──────────────────────────────────────────
if exist ".env" (
  for /f "usebackq tokens=1,* delims==" %%A in (".env") do (
    if /i "%%A"=="QASE_API_TOKEN" set "QASE_API_TOKEN=%%B"
  )
) else (
  echo WARNING: .env file not found. Create it with QASE_API_TOKEN=your_token_here
  pause
  exit /b 1
)

echo Installing Playwright browsers...
call npx playwright install chromium

echo.
echo Running all HWC-Automation tests on Chromium...
echo Results will be pushed to Qase project AR (AMRIT_Regression)
echo.

rem  02c-register-abha.test.ts excluded: TC31 (751) and TC32 (752) are manual tests in Qase
call npx playwright test tests/01-login.test.ts tests/02-register.test.ts tests/02b-family-tagging.test.ts tests/03-nurse.test.ts tests/03b-nurse-opd-mmu.test.ts tests/03c-nurse-specialty.test.ts tests/04-doctor.test.ts tests/05-lab_doctor.test.ts tests/06-pharmacist.test.ts --project=chromium

echo.
echo Done. Check Qase: https://app.qase.io/project/AR
pause
