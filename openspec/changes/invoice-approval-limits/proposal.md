# Proposal

## Why

Invoice approval currently allows any authorized approver to approve any amount in one step. The assignment needs bounded approval authority, a two-person escalation path for larger invoices, and clear, non-mutating failures while preserving explicit rejection as a separate decision.

## What Changes

- Add assignment-defined Manager and Director approval limits: 50,000 and 500,000 inclusive, respectively.
- Require two distinct approvers for amounts above 500,000: a Manager or Director may approve first, and a different Director must approve second.
- Keep failed approval attempts from changing invoice status or approval history, and return a clear reason that the UI can display.
- Show server-provided escalation progress and ordered approver identity, role, and approval time in the invoice and approvals views, with details accessible by hover, keyboard focus, and touch.
- Preserve explicit invoice rejection as a separate workflow that records Rejected status and its reason.
- Migrate authorization and demo-account roles from Approver/Admin to Manager/Director in a separately scoped implementation task; do not treat the role names as interchangeable.
- Implement and test single-approver limits before the two-approver escalation, with separate commits for those implementation slices.

## Capabilities

### New Capabilities
- `invoice-approval`: Amount-based approval authority, escalation, failure behavior, and explicit rejection outcomes.

### Modified Capabilities

## Impact

- Domain approval policy and invoice decision data in `InvoiceApp.Domain`.
- API role authorization and decision endpoints, plus configured demo users, in `InvoiceApp.Api`.
- Static UI presentation of server-returned decision errors and statuses.
- xUnit domain tests and Playwright UI coverage for an over-limit approval attempt.
- Assignment verification deliverables: baseline and post-change mutation measurements, review verdicts, interaction log, write-up, and video.