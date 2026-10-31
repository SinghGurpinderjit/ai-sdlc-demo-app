# AI in SDLC Assignment

## Baseline Results

Captured before approval-feature implementation on 2026-10-31.

- Unit tests: `dotnet test backend/InvoiceApp.sln` — passed; 7 passed, 0 failed, 0 skipped.
- Mutation test: `dotnet stryker --project InvoiceApp.Domain.csproj --mutate '**/ApprovalService.cs'`, run from `backend/tests/InvoiceApp.Tests` with Stryker.NET 4.13.0 — 60.00% mutation score; 12 killed, 8 survived, 0 timed out. Stryker created 51 mutants; 20 were tested and 31 were skipped.
- Stryker report: [baseline mutation report](backend/tests/InvoiceApp.Tests/StrykerOutput/2026-10-31.02-44-10/reports/mutation-report.html).
- Stryker 4.13.0 was already installed; no tool installation was needed.
