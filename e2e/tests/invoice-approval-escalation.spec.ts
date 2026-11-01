import { expect, test } from '@playwright/test';
import { InvoiceApprovalsPage } from '../pages/invoice-approvals-page';

test('Manager first approval requires a distinct Director and exposes ordered history', async ({ page }) => {
  const app = new InvoiceApprovalsPage(page);
  const customerName = `Escalation School ${Date.now()}`;

  await page.goto('/');
  const manager = await app.signInAndReadSession('demo.approver', 'ChangeMe123!');
  expect(manager.role).toBe('Manager');
  const invoiceId = await app.createAndSubmitInvoice(customerName, '750000');
  const submitted = await app.readInvoice(invoiceId, manager.token);
  expect(submitted.amount).toBeGreaterThan(500000);
  expect(submitted.status).toBe('PendingApproval');
  expect(submitted.approvalHistory).toEqual([]);

  await expect(app.invoiceRow(invoiceId).getByText('0/2 - First approval needed')).toBeVisible();
  await app.openApprovals();
  await expect(app.pendingItem(invoiceId).getByText('0/2 - First approval needed')).toBeVisible();
  await app.approve(invoiceId);
  await expect(app.pendingItem(invoiceId).getByText('1/2 - Director approval needed')).toBeVisible();
  const firstApproval = await app.readInvoice(invoiceId, manager.token);
  expect(firstApproval.status).toBe('PendingApproval');
  expect(firstApproval.approvalHistory).toHaveLength(1);
  expect(firstApproval.approvalHistory[0]).toMatchObject({
    approverId: manager.username,
    approverName: manager.username,
    role: manager.role
  });
  expect(Number.isFinite(Date.parse(firstApproval.approvalHistory[0].approvedAt))).toBe(true);

  await app.openInvoices();
  await expect(app.invoiceRow(invoiceId).getByText('1/2 - Director approval needed')).toBeVisible();
  await app.expectApprovalDetails(invoiceId, app.invoiceRow(invoiceId), firstApproval.approvalHistory, 'hover');
  await app.expectApprovalDetails(invoiceId, app.invoiceRow(invoiceId), firstApproval.approvalHistory, 'keyboard');
  await app.openApprovals();
  const pendingItem = app.pendingItem(invoiceId);
  await expect(pendingItem.getByText('1/2 - Director approval needed')).toBeVisible();
  await app.expectApprovalDetails(invoiceId, pendingItem, firstApproval.approvalHistory, 'hover');
  await app.expectApprovalDetails(invoiceId, pendingItem, firstApproval.approvalHistory, 'keyboard');

  await app.signOut();
  const director = await app.signInAndReadSession('demo.admin', 'ChangeMe123!');
  expect(director.role).toBe('Director');
  expect(director.username).not.toBe(manager.username);
  await app.openApprovals();
  await app.approve(invoiceId);
  await expect(app.pendingItem(invoiceId)).toHaveCount(0);
  const completed = await app.readInvoice(invoiceId, director.token);
  expect(completed.status).toBe('Approved');
  expect(completed.approvalHistory).toHaveLength(2);
  expect(completed.approvalHistory[0]).toEqual(firstApproval.approvalHistory[0]);
  expect(completed.approvalHistory[1]).toMatchObject({
    approverId: director.username,
    approverName: director.username,
    role: director.role
  });
  expect(completed.approvalHistory[1].approverId).not.toBe(completed.approvalHistory[0].approverId);
  expect(Number.isFinite(Date.parse(completed.approvalHistory[1].approvedAt))).toBe(true);
  expect(Date.parse(completed.approvalHistory[1].approvedAt))
    .toBeGreaterThanOrEqual(Date.parse(completed.approvalHistory[0].approvedAt));

  await app.openInvoices();
  const invoiceRow = app.invoiceRow(invoiceId);
  await expect(invoiceRow.getByText('Approved 2/2')).toBeVisible();
  await app.expectApprovalDetails(invoiceId, invoiceRow, completed.approvalHistory, 'hover');
  await app.expectApprovalDetails(invoiceId, invoiceRow, completed.approvalHistory, 'keyboard');

  await app.openApprovals();
  await expect(app.pendingItem(invoiceId)).toHaveCount(0);
});

test('Manager over-limit approval shows the server reason and preserves pending status and history after refresh', async ({ page }) => {
  const app = new InvoiceApprovalsPage(page);
  const customerName = `Manager Limit School ${Date.now()}`;

  await page.goto('/');
  const signInResponse = page.waitForResponse(response =>
    response.url().endsWith('/api/auth/login') && response.request().method() === 'POST');
  await app.signIn('demo.approver', 'ChangeMe123!');
  const session = await (await signInResponse).json();
  expect(session.role).toBe('Manager');

  const invoiceId = await app.createAndSubmitInvoice(customerName, '50000.01');
  await expect(app.invoiceRow(invoiceId).getByRole('cell', { name: 'Pending Approval', exact: true })).toBeVisible();
  const beforeAttempt = await app.readInvoice(invoiceId, session.token);
  expect(beforeAttempt.amount).toBe(50000.01);
  expect(beforeAttempt.status).toBe('PendingApproval');
  expect(beforeAttempt.approvalHistory).toEqual([]);

  await app.openApprovals();
  const approvalResponse = page.waitForResponse(response =>
    response.url().endsWith(`/api/approvals/${invoiceId}/approve`) && response.request().method() === 'POST');
  await app.approve(invoiceId);
  const failedApproval = await approvalResponse;
  expect(failedApproval.status()).toBe(409);
  const failure = await failedApproval.json();
  expect(failure.error).toMatch(/Manager approval limit of 50000(?:\.0+)? was exceeded by invoice amount 50000\.01\./);
  await expect(app.decisionError()).toBeVisible();
  await expect(app.decisionError()).toHaveText(failure.error);
  await expect(app.pendingItem(invoiceId)).toBeVisible();

  const afterAttempt = await app.readInvoice(invoiceId, session.token);
  expect(afterAttempt.status).toBe(beforeAttempt.status);
  expect(afterAttempt.approvalHistory).toEqual(beforeAttempt.approvalHistory);
  await app.openInvoices();
  await expect(app.invoiceRow(invoiceId).getByRole('cell', { name: 'Pending Approval', exact: true })).toBeVisible();

  await page.reload();
  await expect(app.invoiceRow(invoiceId).getByRole('cell', { name: 'Pending Approval', exact: true })).toBeVisible();
  await app.openApprovals();
  await expect(app.pendingItem(invoiceId)).toBeVisible();
  const afterRefresh = await app.readInvoice(invoiceId, session.token);
  expect(afterRefresh.status).toBe(beforeAttempt.status);
  expect(afterRefresh.approvalHistory).toEqual(beforeAttempt.approvalHistory);
});