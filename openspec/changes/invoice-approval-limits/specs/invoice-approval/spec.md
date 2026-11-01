# Spec Delta

## Purpose

Defines invoice approval authority by amount, the escalation needed for higher-value invoices, and the observable outcomes of failed approval and explicit rejection decisions.

## ADDED Requirements

### Requirement: Single-approver amount limits
The system SHALL allow a Manager to approve an invoice of 50,000 or less and SHALL allow a Director to approve an invoice of 500,000 or less.

#### Scenario: Manager approves at the inclusive limit
- **WHEN** a Manager approves a pending invoice for 50,000
- **THEN** the invoice becomes Approved

#### Scenario: Director approves at the inclusive limit
- **WHEN** a Director approves a pending invoice for 500,000
- **THEN** the invoice becomes Approved

### Requirement: Two distinct approvals above 500,000
An invoice above 500,000 SHALL require approvals from two distinct users before becoming Approved. The first approval MAY be made by a Manager or a Director, and the second approval SHALL be made by a different Director.

#### Scenario: Manager makes the first approval
- **WHEN** a Manager makes the first approval of an invoice above 500,000
- **THEN** the invoice remains PendingApproval

#### Scenario: Director makes the first approval
- **WHEN** a Director makes the first approval of an invoice above 500,000
- **THEN** the invoice remains PendingApproval

#### Scenario: Director completes escalation with a distinct user
- **WHEN** a Director different from the first approver makes the second approval of an invoice above 500,000
- **THEN** the invoice becomes Approved

### Requirement: Escalated approval progress is visible
For an invoice above 500,000, the invoice list and pending-approvals view SHALL present the server-provided approval progress and ordered history. Each history entry SHALL expose the approver's identity/name, role, and approval time, discoverable by mouse hover, keyboard focus, and touch. The UI SHALL present server-provided state and SHALL NOT determine approval eligibility.

#### Scenario: Escalated invoice awaits its first approval
- **WHEN** an invoice above 500,000 is pending with no accepted approvals
- **THEN** both views show zero of two approvals complete and that the first approval is needed

#### Scenario: Escalated invoice awaits its Director approval
- **WHEN** an authorized first approver has approved an invoice above 500,000
- **THEN** both views show one of two approvals complete, “Director approval needed,” and the first approver's identity/name, role, and approval time

#### Scenario: Escalated invoice has both approvals
- **WHEN** a distinct Director completes the second approval
- **THEN** the invoice is Approved, the invoice list shows “Approved 2/2” and both approvals in order with each approver's identity/name, role, and approval time, and the invoice no longer appears in pending approvals

#### Scenario: Approval details are accessible without hover
- **WHEN** a user discovers an approver's details in either view
- **THEN** the identity/name, role, and approval time are available by mouse hover, keyboard focus, and touch

### Requirement: Failed approval attempts do not change invoice decisions
A failed approval attempt SHALL return a clear reason and SHALL leave the invoice status and approval history unchanged.

#### Scenario: Manager exceeds the single-approver limit
- **WHEN** a Manager attempts to approve an invoice above 50,000 and at most 500,000
- **THEN** the response explains why approval failed and the invoice status and approval history remain unchanged

#### Scenario: The same user attempts to approve twice
- **WHEN** a user already recorded as the first approver attempts the second approval
- **THEN** the response explains that a distinct approver is required and the invoice status and approval history remain unchanged

#### Scenario: A non-Director attempts the second approval
- **WHEN** a user who is not a Director attempts the second approval of an invoice above 500,000
- **THEN** the response explains that the second approver must be a Director and the invoice status and approval history remain unchanged

### Requirement: Explicit rejection is a distinct decision
An authorized rejection of a pending invoice SHALL set its status to Rejected and SHALL record the rejection reason.

#### Scenario: Reject a pending invoice with a reason
- **WHEN** an authorized user explicitly rejects a pending invoice with a non-empty reason
- **THEN** the invoice becomes Rejected and the reason is recorded