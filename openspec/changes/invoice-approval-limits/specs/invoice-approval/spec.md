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
An invoice above 500,000 SHALL require approvals from two distinct users before becoming Approved, and the second approval SHALL be made by a Director.

> **Unresolved policy:** The role permitted to make the first approval above 500,000 has not been specified. This behavior SHALL NOT be implemented until that role is clarified and this requirement is updated; this change does not authorize any role by default.

#### Scenario: First permitted approval leaves the invoice pending
- **WHEN** the role authorized by the clarified first-approver policy makes the first approval of an invoice above 500,000
- **THEN** the invoice remains PendingApproval

#### Scenario: Director completes escalation with a distinct user
- **WHEN** a Director different from the first approver makes the second approval of an invoice above 500,000
- **THEN** the invoice becomes Approved

### Requirement: Escalated approval progress is visible
For an invoice above 500,000, the UI SHALL show the server-provided approval count and current approval state in the invoice and approvals views. The UI SHALL identify that a Director approval is needed after the first approval and SHALL NOT determine approval eligibility itself.

#### Scenario: Escalated invoice awaits its first approval
- **WHEN** an invoice above 500,000 is pending with no accepted approvals
- **THEN** the UI shows that zero of two approvals are complete and that the first approval is needed

#### Scenario: Escalated invoice awaits its Director approval
- **WHEN** an authorized first approver has approved an invoice above 500,000
- **THEN** the invoice remains PendingApproval and the UI shows one of two approvals complete and that a Director approval is needed

#### Scenario: Escalated invoice has both approvals
- **WHEN** a distinct Director completes the second approval
- **THEN** the invoice is Approved and the UI shows two of two approvals complete

### Requirement: Failed approval attempts do not change invoice decisions
A failed approval attempt SHALL return a clear reason and SHALL leave the invoice status and approval history unchanged.

#### Scenario: Approval exceeds the actor's limit
- **WHEN** a Manager attempts to approve an invoice above 50,000 without an applicable escalation path
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