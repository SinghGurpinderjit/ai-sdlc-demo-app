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

- [ ] 4.1 Obtain an explicit decision on the role permitted to make the first approval above 500,000, update the capability spec with that decision, and verify `openspec validate invoice-approval-limits` passes; do not begin 4.2 before this task is complete.
- [ ] 4.2 Implement the above-500,000 approval progression with ordered approval history and add xUnit tests for a pending first approval, a distinct Director second approval, repeated-user rejection, and non-Director second-approval failure; verify every failed attempt leaves status and history unchanged with a clear reason.
- [ ] 4.3 Keep explicit rejection independent of approval escalation and add/retain xUnit coverage that a pending invoice becomes Rejected with its reason; verify `dotnet test backend/InvoiceApp.sln` passes.
- [ ] 4.4 After 4.1 and 4.2 are complete, update the invoice list and approvals view under `backend/src/InvoiceApp.Api/wwwroot/` to show server-provided escalation progress: zero of two approvals with first approval needed, one of two with “Director approval needed,” and Approved with two of two. Add page-object-based Playwright coverage for these states; verify the UI does not implement approval policy and `npm test` passes.
- [ ] 4.5 Commit the tested escalation slice, including its UI progress and tests, separately after the single-approver commit; verify the commit history and diff show distinct implementation/test boundaries.

## 5. UI End-to-End Verification

- [ ] 5.1 Add a Playwright page-object-based E2E test for a Manager attempting to approve an invoice for 50,000.01; verify the UI displays the server's rejection reason and the invoice remains PendingApproval, using role/label locators and passing `npm test`.

## 6. Review and Assignment Deliverables

- [ ] 6.1 Run the full xUnit and Playwright suites and repeat mutation measurement with the baseline tool/configuration; verify results are recorded and the post-change mutation score is compared with baseline.
- [ ] 6.2 Complete the required PR review and list every finding in the PR description with a `fixed`, `dismissed` plus reason, or `deferred` plus reason verdict; verify blocking findings are resolved or explicitly reported before acceptance.
- [ ] 6.3 Complete the required interaction log in the repository-root `ai-interactions.jsonl`; verify it records prompts, agent/tool activity, the unresolved-role clarification, test evidence, and separate commit boundaries without secrets.
- [ ] 6.4 Prepare the assignment write-up with the implementation sequence, test/mutation results, and review verdicts; verify all reported results match saved evidence.
- [ ] 6.5 Record the required demonstration video showing role-based approval limits, an over-limit UI failure, and explicit rejection; verify the visible outcomes match the write-up and test evidence.