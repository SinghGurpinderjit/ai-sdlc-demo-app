---
name: invoice-domain-rules
description: "Use when working on invoice approval limits, escalation, role authorization, rejection behavior, related xUnit or Playwright tests, or invoice UI changes. Provides shared domain context; active OpenSpec requirements remain the acceptance source of truth."
---

# Invoice Domain Rules

Use this skill when implementing, reviewing, or testing invoice approval behavior in this repository.

## Approval rules

- Use C# `decimal` for financial amounts; do not use `float` or `double`.
- A Manager may approve amounts up to and including 50,000.
- A Director may approve amounts up to and including 500,000.
- Amounts above 500,000 require two distinct approvers. The second approver must be a Director.
- Never count the same user ID as both approvers.
- If active OpenSpec requirements do not clarify which role may make the first approval above 500,000, flag the ambiguity instead of inventing a rule.

## Rejection and failed approval

- An authorized explicit rejection of a pending invoice sets its status to `Rejected` and records the reason and decision details using the existing domain model.
- A failed approval attempt, such as exceeding a limit, repeating the first approver, or lacking the required Director role, returns a clear reason and leaves the invoice status and approval history unchanged.
- Validate before mutating or persisting invoice state.
- Follow existing service and controller error-mapping patterns. Do not introduce a new failure/result abstraction without approval.
- The UI may display the resulting status or a server-returned failure message; it must not decide approval policy.

## Code boundaries

- Approval policy belongs in `backend/src/InvoiceApp.Domain`.
- API controllers handle routing and authorization, not approval policy.
- The UI is under `backend/src/InvoiceApp.Api/wwwroot/` and handles presentation only.

## Tests

- Follow existing xUnit patterns in `backend/tests/InvoiceApp.Tests`.
- Cover thresholds and boundaries, over-limit failures, distinct approvers, Director as the second approver, and clear failure reasons.
- Test explicit rejection separately: assert status `Rejected` and its reason.
- For failed approval attempts, assert status and approval history remain unchanged.
- Playwright tests belong under repository-relative `e2e/`; assert the relevant rejection status/reason or failed-approval message is visible.

## Roles and requirements

- The existing app uses `Approver` and `Admin`; the requirement specifies `Manager` and `Director`. Do not assume they are interchangeable or migrate roles without a separately approved OpenSpec task.
- Use active OpenSpec requirements for acceptance criteria. This skill provides shared technical context and must not override the specification.
