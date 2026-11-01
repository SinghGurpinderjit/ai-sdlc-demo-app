# Invoice Approval Demo App

A small invoice approval app used for live AI-in-SDLC demos. It is deliberately simple: a .NET 8 API, a plain web UI, and an in-memory store, so it runs with one command and no database.

## Run it

```
dotnet run --project backend/src/InvoiceApp.Api
```

Open http://localhost:5000 and sign in:

| User | Password | Role |
| --- | --- | --- |
| `demo.approver` | `ChangeMe123!` | Manager |
| `demo.admin` | `ChangeMe123!` | Director |

These are demo accounts for a local, in-memory app. They are not real credentials.

## What it does

1. Create an invoice (it starts as a draft).
2. Submit it for approval.
3. An authorized user approves it or explicitly rejects it with a reason.

Managers can approve invoices up to and including 50,000. Directors can approve invoices up to and including 500,000. An invoice above 500,000 needs two different approvers: a Manager or Director first, followed by a different Director. The first approval leaves the invoice pending; the second completes approval.

A failed approval returns a clear reason and leaves the invoice status and approval history unchanged. Explicit rejection is a separate decision: it sets the status to Rejected and records the reason.

## Tests

```
dotnet test backend/InvoiceApp.sln
```

Run the Playwright browser tests from `e2e`:

```powershell
cd e2e
npm install
npm test
```

Playwright starts the API at `http://localhost:5000` or reuses an existing server there. The current browser tests cover Manager-first escalation and a Manager over-limit failure. If PowerShell blocks the `npm` script, use `npm.cmd` instead.

## Project layout

```
backend/
  src/InvoiceApp.Domain   business rules
  src/InvoiceApp.Api      controllers, sign-in, web UI (wwwroot)
  tests/InvoiceApp.Tests  xUnit tests
e2e/                      Playwright browser tests and page objects
openspec/                 feature proposals, designs, requirements, and tasks
docs/use-cases            short feature briefs
AGENTS.md                 conventions for AI coding agents
```

## Use cases

- [UC-1 Role-based invoice approval limits](docs/use-cases/UC-1-role-based-approval-limits.md)
- [UC-2 High-value two-approver escalation](docs/use-cases/UC-2-high-value-two-approver-escalation.md)
- [UC-3 Failed approval and explicit rejection](docs/use-cases/UC-3-failed-approval-and-explicit-rejection.md)
