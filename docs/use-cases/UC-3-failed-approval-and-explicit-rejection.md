# UC-3: Failed approval and explicit rejection

## Background

A rejected approval attempt and a user's explicit decision to reject an invoice are different outcomes. A failed approval must not partially update the invoice.

## The idea

Return clear server messages for invalid approval attempts without changing status or approval history. Keep explicit rejection as a separate action that records Rejected and the supplied reason.

## What the business asked for

- Approval failures include exceeding a role limit, repeating an approver, or using a non-Director as the second approver.
- A failed attempt leaves status and approval history unchanged.
- The API returns a clear reason, and the UI presents that server-provided reason.
- An authorized explicit rejection requires a non-empty reason, changes the invoice to Rejected, and records the reason.
- Rejection is not an approval and does not add an approval-history entry; any accepted history remains intact.

## Main flow: failed approval

1. An authorized user attempts an approval that violates a limit or escalation rule.
2. The Domain rejects the request before changing or saving invoice decision state.
3. The API returns the reason and the UI displays it.

## Alternate flow: explicit rejection

1. An authorized user rejects a pending invoice and supplies a reason.
2. The system marks the invoice Rejected and records the reason and decision details.
3. Existing approval history, if any, is preserved.

## Verification

- xUnit tests verify clear failures, unchanged status/history, and explicit rejection with a saved reason.
- Playwright coverage verifies a Manager over-limit reason and unchanged pending state/history after refresh.
- Explicit rejection and other invalid escalation attempts have Domain test coverage; additional dedicated browser scenarios are separate planned coverage.