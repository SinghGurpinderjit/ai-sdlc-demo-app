# Tasks

## 1. Baseline

- [x] 1.1 Run `dotnet test backend/InvoiceApp.sln` before implementation and save the baseline result; verify the record includes the command, outcome, and any existing failures.
- [x] 1.2 On .NET 8, install the compatible Stryker version with `dotnet tool install -g dotnet-stryker --version 4.13.0`; measure and record the baseline mutation score for invoice approval. Verify the report identifies the tool/version, target, score, and report location for later comparison.

## 2. Role Migration (Separate Scope)

- [x] 2.1 Migrate API authorization from the current `Approver`/`Admin` role names to explicit `Manager`/`Director` and add focused authorization coverage; verify allowed and denied roles, including that the old names are not implicit aliases.
- [x] 2.2 Update configured demo accounts to provide the `Manager` and `Director` roles; verify each account can sign in and receives the configured role without relying on role-name equivalence.

## 3. Single-Approver Limits

- [x] 3.1 Implement the Manager limit of 50,000 and Director limit of 500,000 in the domain, using `decimal`; add xUnit boundary tests for each inclusive limit and just-over-limit failure, asserting clear reasons and unchanged status/history on failure.
- [x] 3.2 Connect authenticated identity and role to the domain decision flow without accepting actor data from the request body; verify API failures preserve the server reason and that the UI displays it without implementing approval policy.
- [x] 3.3 Commit the tested single-approver limit slice independently; verify the commit contains its implementation and tests but no two-approver escalation (`2e0c4b8`).

## 4. Two-Approver Escalation

- [x] 4.1 Record the policy that either a Manager or Director may make the first approval above 500,000 and a different Director must make the second; update the capability spec and verify `openspec validate invoice-approval-limits` passes before beginning 4.2.
- [x] 4.2 Implement the above-500,000 approval progression with ordered approval history in the Domain and API. Add xUnit tests for Manager-first and Director-first approvals that leave the invoice PendingApproval, a distinct Director second approval, repeated-user rejection, and non-Director second-approval failure; verify every failed attempt leaves status and history unchanged with a clear reason and `dotnet test backend/InvoiceApp.sln` passes.
- [x] 4.3 Keep explicit rejection independent of approval escalation and add/retain xUnit coverage that a pending invoice becomes Rejected with its reason; verify `dotnet test backend/InvoiceApp.sln` passes.
- [x] 4.4 After 4.1 and 4.2 are complete, update the invoice list and pending-approvals view under `backend/src/InvoiceApp.Api/wwwroot/` to present the server-provided ordered approval history and progress: zero of two with “First approval needed,” one of two with “Director approval needed,” and completed as “Approved 2/2” with both approvers' identity/name, role, and approval time. Details must be accessible by hover, keyboard focus, and touch; the UI remains presentation-only. Run `dotnet test backend/InvoiceApp.sln`; Playwright verification is in Task 5.
- [x] 4.5 Commit the tested escalation slice, including its UI progress and tests, separately after the single-approver commit; verify the commit history and diff show distinct implementation/test boundaries. (`5b0caf1`)

## 5. UI End-to-End Verification

- [ ] 5.1 Add a Playwright page-object-based E2E test for a Manager attempting to approve an invoice for 50,000.01; verify the UI displays the server's rejection reason and the invoice remains PendingApproval, using role/label locators and passing `npm test`.
- [ ] 5.2 Add Playwright page-object-based E2E coverage for Task 4 escalation UI: verify 0/2 with first approval needed, 1/2 with “Director approval needed,” approver identity/role/time details using hover, keyboard focus, and touch, and Approved 2/2 after a distinct Director approves. Verify completed invoices leave the pending list and `npm test` passes.

## 6. Review and Assignment Deliverables

- [ ] 6.1 Run the full xUnit and Playwright suites and repeat mutation measurement with the baseline tool/configuration; verify results are recorded and the post-change mutation score is compared with baseline.
- [ ] 6.2 Complete the required PR review and list every finding in the PR description with a `fixed`, `dismissed` plus reason, or `deferred` plus reason verdict; verify blocking findings are resolved or explicitly reported before acceptance.
- [ ] 6.3 Complete the required interaction log in the repository-root `ai-interactions.jsonl`; verify it records prompts, agent/tool activity, the approved policy decision that either a Manager or Director may approve first above 500,000 and a different Director must approve second, test evidence, and separate commit boundaries without secrets.
- [ ] 6.4 Prepare the assignment write-up with the implementation sequence, test/mutation results, and review verdicts; verify all reported results match saved evidence.
- [ ] 6.5 Record the required demonstration video showing role-based approval limits, an over-limit UI failure, and explicit rejection; verify the visible outcomes match the write-up and test evidence.