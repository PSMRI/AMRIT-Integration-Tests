@echo off
cd /d "%~dp0"

echo ========================================
echo   HWC-Automation Test Suite
echo   Qase Project: AR (AMRIT_Regression)
echo ========================================
echo.

rem ── Load QASE_API_TOKEN from .env ──────────────────────────────────────────
if exist ".env" (
  for /f "usebackq tokens=1,* delims==" %%A in (".env") do (
    if /i "%%A"=="QASE_API_TOKEN" set "QASE_API_TOKEN=%%B"
  )
  echo Loaded token from .env
) else (
  echo WARNING: .env file not found. Create it with QASE_API_TOKEN=your_token_here
  echo.
)

rem ── Find npx ───────────────────────────────────────────────────────────────
where npx >nul 2>&1
if %ERRORLEVEL% neq 0 (
  echo ERROR: npx not found. Open a Node.js terminal and run this bat from there.
  pause
  exit /b 1
)

echo Starting test run (excluding 07-e2e)...
echo Results will be reported to Qase automatically.
echo.

rem  02c-register-abha.test.ts excluded: TC31 (751) and TC32 (752) are manual tests in Qase
npx playwright test ^
  tests/01-login.test.ts ^
  tests/02-register.test.ts ^
  tests/02b-family-tagging.test.ts ^
  tests/03-nurse.test.ts ^
  tests/03b-nurse-opd-mmu.test.ts ^
  tests/03c-nurse-specialty.test.ts ^
  tests/04-doctor.test.ts ^
  tests/05-lab_doctor.test.ts ^
  tests/06-pharmacist.test.ts ^
  --project=chromium

set EXIT_CODE=%ERRORLEVEL%

echo.
if %EXIT_CODE% == 0 (
  echo All tests passed!
) else (
  echo Some tests failed. Check test-results\index.html for details.
)

echo.
echo HTML Report : test-results\index.html
echo Qase Runs   : https://app.qase.io/run/AR
echo.
pause
exit /b %EXIT_CODE%
