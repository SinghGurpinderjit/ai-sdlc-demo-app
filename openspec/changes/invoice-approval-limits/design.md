# Design

## Context

See proposal.md - Why. `ApprovalService` currently approves every pending invoice in one call and stores a single decision identity and timestamp. The API obtains the caller from the authenticated session, maps `InvalidOperationException` to a conflict response with an error message, and the static UI displays that server message. The domain amount is already a C# `decimal`; the current configured roles and authorization attributes use `Approver` and `Admin`.

## Goals / Non-Goals

**Goals:**
- Keep amount and escalation policy in `InvoiceApp.Domain`, with the API limited to transport and authorization and the UI limited to presentation.
- Preserve a decision history sufficient to identify distinct approvers and prove that failed attempts did not alter approval state.
- Keep explicit rejection independent of the approval progression.
- Enforce the single-limit and escalation implementation/commit boundary described in tasks.md.

**Non-Goals:**
- Treating `Approver` as `Manager` or `Admin` as `Director` without an explicit role migration.
- Moving approval rules into controllers or adding client-side policy decisions.

## Decisions

- **Keep policy and validation in the domain service.** The service validates the pending state, role limit, escalation position, and distinct-user rule before persisting a change. This preserves the existing domain ownership boundary. Putting thresholds in the controller or UI was rejected because those layers must not become policy authorities.
- **Use exact monetary values.** Keep invoice amounts and threshold comparisons as C# `decimal`, including boundary checks. Floating-point types were rejected because they cannot reliably represent the financial limits.
- **Trust the authenticated session for actor identity and role.** The API passes the authenticated caller's identity and role to the domain; neither is accepted from the decision request body. The existing session username is the current stable caller identity, and approval history must use that identity consistently so one user cannot count twice. Client-supplied actor data was rejected because it could be spoofed.
- **Retain ordered approval history for escalation.** A first approval above the threshold records a pending approval step without marking the invoice Approved. Only a valid, distinct Director second approval completes the decision. Validate each attempt before changing history or status. Rejection continues through its own operation and records Rejected plus its reason.
- **Allow either role to approve first.** A Manager or Director may make the first approval above 500,000; a different Director must make the second. This follows the clarified policy and does not permit the same user to act twice.
- **Reuse server error mapping and UI presentation.** Return a clear domain failure through the existing API error response; the current UI already displays the server-provided decision message. Do not duplicate limit logic in JavaScript or add a new result abstraction unless implementation evidence requires an approved design change.
- **Render escalation progress and history from server state.** The invoice list and pending-approvals view display the server-provided ordered approval history and progress: zero of two before approval, one of two with “Director approval needed” after the first accepted step, and Approved with two of two after completion. Each recorded approval exposes the approver's identity/name, role, and approval time. These details are discoverable by mouse hover, keyboard focus, and touch; hover is not the only access method. The UI presents server-provided state and does not calculate eligibility or make approval decisions.
- **Migrate role names in a separate task.** Update authorization restrictions and configured demo accounts explicitly for Manager and Director. Do not retain implicit Approver/Admin aliases. This is separate from the approval-limit commit and must be independently tested.

## Risks / Trade-offs

- [A history model change may affect invoice serialization and UI consumers] -> Preserve existing final status and decision fields where practical, and cover API-visible outcomes with focused integration and Playwright checks.
- [UI progress could drift from domain state] -> Render server-provided approval history/count and status; cover the zero, one, and two approval states in Playwright.
- [Role migration can invalidate current demo sign-in and authorization expectations] -> Migrate authorization and demo-account role configuration together, with tests for allowed and denied roles before approval-policy work depends on them.
- [A failed second approval could accidentally leave partial state] -> Validate role, identity distinctness, and pending status before mutating or persisting; test that both status and history are unchanged on each failure.

## Migration Plan

1. Capture the current xUnit and mutation-measurement baseline.
2. In a separate role-migration task, replace the current `Approver`/`Admin` authorization assignments and demo-account roles with explicit `Manager`/`Director` assignments, then verify sign-in and authorization behavior.
3. Implement and test single-approver limits, then commit that slice independently.
4. Implement and test escalation under the clarified policy as a separate subsequent commit.
5. Run the required UI E2E and post-change mutation measurement, then complete review deliverables. Roll back by reverting the relevant isolated commit if its verification fails; do not combine the single-limit and escalation commits.

## Open Questions

- None for the approval role sequence. The first approver may be a Manager or Director; the second must be a different Director.