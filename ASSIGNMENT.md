# AI in SDLC Assignment

## Baseline Results

Captured before approval-feature implementation on 2026-10-31.

- Unit tests: `dotnet test backend/InvoiceApp.sln` — passed; 7 passed, 0 failed, 0 skipped.
- Mutation test: `dotnet stryker --project InvoiceApp.Domain.csproj --mutate '**/ApprovalService.cs'`, run from `backend/tests/InvoiceApp.Tests` with Stryker.NET 4.13.0 — 60.00% mutation score; 12 killed, 8 survived, 0 timed out. Stryker created 51 mutants; 20 were tested and 31 were skipped.
- Stryker report: [baseline mutation report](backend/tests/InvoiceApp.Tests/StrykerOutput/2026-10-31.02-44-10/reports/mutation-report.html).
- Stryker 4.13.0 was already installed; no tool installation was needed.

## Post-change Results (Task 6.1)

Captured on 2026-10-31 by `qa-validator`.

- Unit tests: `dotnet test backend/InvoiceApp.sln` from the repository root; exit 0, 28 passed, 0 failed, 0 skipped.
- Browser tests: `npm --prefix e2e test` from the repository root; exit 0, 2 passed. Used installed Chrome with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe`; no browser download or TLS bypass was needed.
- Mutation test: `dotnet stryker --project InvoiceApp.Domain.csproj --mutate '**/ApprovalService.cs'` from `backend/tests/InvoiceApp.Tests`; exit 0, using Stryker.NET 4.13.0, confirmed by `dotnet tool list --global` and the run banner.
- Mutation score: **72.22%**, compared with the baseline **60.00%**, an increase of **12.22 percentage points**. Tool version and mutation scope were unchanged; the implementation changed the mutant population.
- Stryker created 108 mutants: 39 killed, 11 survived, 0 timed out, 8 compile errors, 4 without coverage, and 46 ignored. The 50 tested mutants were killed or survived; the 4 without coverage also count against the mutation score.
- Report: [post-change mutation report](backend/tests/InvoiceApp.Tests/StrykerOutput/2026-10-31.20-55-32/reports/mutation-report.html). Playwright generated its HTML report under `e2e/playwright-report/`.
