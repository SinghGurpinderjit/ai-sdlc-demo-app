# UC-2: Two-approver review for high-value invoices

## Background

A single approval is not sufficient for invoices above 500,000. Now It requires a second, independent review before these invoices can be finalized.

## The idea

Require two different authenticated users for an invoice above 500,000. Either a Manager or a Director may approve first; a different Director must approve second.

## What the business asked for

- The first accepted approval leaves the invoice PendingApproval.
- The invoice records each approver's identity, role, and approval time in order.
- A different Director's second approval changes the invoice to Approved.
- The invoice and pending-approvals views show server-provided progress: 0/2, 1/2 with "Director approval needed," and "Approved 2/2."
- Approval details are accessible by hover, keyboard focus, and touch.
- Repeating the first approver or using a non-Director for the second approval returns a clear reason and leaves status/history unchanged.

## Main flow

1. A Manager or Director approves a pending invoice above 500,000.
2. The system records the first approval and keeps the invoice pending at 1/2.
3. A different Director approves it.
4. The system records the second approval, marks it Approved, and removes it from pending approvals.

## Verification

- xUnit tests cover Manager-first and Director-first progress, distinct Director completion, repeated-user rejection, and non-Director second-approval failure.
- The current Playwright escalation flow covers Manager-first approval, visible progress and history, and completion by a different Director.
- Touch-specific Playwright coverage was removed and remains a documented verification gap.
