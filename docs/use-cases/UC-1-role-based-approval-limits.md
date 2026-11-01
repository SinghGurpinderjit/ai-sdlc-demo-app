# UC-1: Role-based invoice approval limits

## The idea

Allow Managers and Directors to approve invoices only within their assigned amount limits. Keep these rules in the Domain service so the API and browser cannot make different approval decisions.

## What the business asked for

- A Manager can approve a pending invoice for 50,000 or less.
- A Director can approve a pending invoice for 500,000 or less.
- Amounts and comparisons use C# `decimal`.
- A successful single-approver decision records the approver and decision time.
- A Manager attempting an amount above 50,000 receives a clear reason; status and approval history stay unchanged.
- A Director attempting an amount above 500,000 receives a clear reason; status and approval history stay unchanged.

## Main flow

1. An authorized Manager or Director submits an invoice for approval.
2. The system checks the authenticated role and invoice amount.
3. If the role's limit covers the amount, the invoice becomes Approved and the decision is recorded.
4. If the Manager or Director limit is exceeded, the system returns a reason without changing the invoice.

## Verification

- xUnit tests cover inclusive limits, just-over-limit failures, clear reasons, and unchanged invoice state.
- Playwright coverage exercises the Manager's 50,000.01 over-limit failure and verifies the visible server reason and unchanged state after refresh.
- The Director's single-approval boundary success cases are covered by the Domain tests; additional UI scenarios are separate planned coverage.
