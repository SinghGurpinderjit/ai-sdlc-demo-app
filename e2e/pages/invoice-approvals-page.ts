import { expect, Locator, Page } from '@playwright/test';

export type ApprovalEntry = {
  approverId: string;
  approverName: string;
  role: string;
  approvedAt: string;
};

export class InvoiceApprovalsPage {
  constructor(private readonly page: Page) {}

  async signInAndReadSession(username: string, password: string): Promise<{
    token: string;
    username: string;
    role: string;
  }> {
    const response = this.page.waitForResponse(response =>
      response.url().endsWith('/api/auth/login') && response.request().method() === 'POST');
    await this.signIn(username, password);
    const signInResponse = await response;
    expect(signInResponse.ok()).toBe(true);
    return signInResponse.json();
  }

  async signIn(username: string, password: string): Promise<void> {
    await this.page.getByLabel('Username').fill(username);
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: 'Sign in' }).click();
    await expect(this.page.getByRole('tab', { name: 'Invoices' })).toBeVisible();
  }

  async signOut(): Promise<void> {
    await this.page.getByRole('button', { name: 'Sign out' }).click();
  }

  async createAndSubmitInvoice(customerName: string, amount: string): Promise<string> {
    await this.page.getByLabel('Customer name').fill(customerName);
    await this.page.getByLabel('Amount').fill(amount);
    await this.page.getByRole('button', { name: 'Create invoice' }).click();

    const row = this.page.getByRole('row').filter({ hasText: customerName });
    await expect(row).toBeVisible();
    const invoiceId = (await row.getByRole('cell').first().innerText()).trim();
    await row.getByRole('button', { name: `Submit invoice ${invoiceId} for approval` }).click();
    return invoiceId;
  }

  async openInvoices(): Promise<void> {
    await this.page.getByRole('tab', { name: 'Invoices' }).click();
  }

  async openApprovals(): Promise<void> {
    await this.page.getByRole('tab', { name: 'Approvals' }).click();
  }

  invoiceRow(invoiceId: string): Locator {
    return this.page.getByRole('row').filter({
      has: this.page.getByRole('cell', { name: invoiceId, exact: true })
    });
  }

  pendingItem(invoiceId: string): Locator {
    return this.page.getByRole('listitem').filter({ hasText: invoiceId });
  }

  async approve(invoiceId: string): Promise<void> {
    await this.pendingItem(invoiceId)
      .getByRole('button', { name: `Approve invoice ${invoiceId}` })
      .click();
  }

  decisionError(): Locator {
    return this.page.getByRole('tabpanel', { name: 'Approvals' }).getByRole('alert');
  }

  async readInvoice(invoiceId: string, token: string): Promise<{
    amount: number;
    status: string;
    approvalHistory: Array<{
      approverId: string;
      approverName: string;
      role: string;
      approvedAt: string;
    }>;
  }> {
    const response = await this.page.request.get(`/api/invoices/${invoiceId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(response.ok()).toBe(true);
    return response.json();
  }

  async expandApprovalHistory(invoiceId: string): Promise<void> {
    await this.page.getByRole('button', { name: new RegExp(`Approval history for ${invoiceId}:`) }).click();
  }

  async expectApprovalDetails(
    invoiceId: string,
    scope: Locator,
    history: ApprovalEntry[],
    interaction: 'hover' | 'keyboard' | 'touch'
  ): Promise<void> {
    const details = await this.page.evaluate(entries => entries.map(entry => {
      const name = entry.approverName || entry.approverId;
      return `${name}, ${entry.role}, ${new Date(entry.approvedAt).toLocaleString()}`;
    }), history);
    const toggle = scope.getByRole('button', {
      name: `Approval history for ${invoiceId}: ${details.join('; ')}`,
      exact: true
    });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    if (interaction === 'hover') {
      await toggle.hover();
      await expect(toggle).toHaveAttribute('title', details.join('; '));
      await this.expandApprovalHistory(invoiceId);
    } else if (interaction === 'keyboard') {
      await toggle.focus();
      await expect(toggle).toBeFocused();
      await expect(toggle).toHaveAccessibleName(`Approval history for ${invoiceId}: ${details.join('; ')}`);
      await toggle.press('Enter');
    } else {
      await toggle.tap();
    }
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const groups = scope.getByRole('group', { name: /^Approval by / });
    await expect(groups).toHaveCount(history.length);
    for (const [index, entry] of history.entries()) {
      const name = entry.approverName || entry.approverId;
      const group = groups.nth(index);
      await expect(group).toBeVisible();
      await expect(group).toHaveAccessibleName(`Approval by ${details[index]}`);
      await expect(group.getByText(`${name} (${entry.role})`, { exact: true })).toBeVisible();
      const time = group.getByLabel(`Approval time for ${name}`, { exact: true });
      await expect(time).toHaveAttribute('datetime', entry.approvedAt);
      await expect(time).toHaveText(await this.page.evaluate(
        approvedAt => new Date(approvedAt).toLocaleString(), entry.approvedAt));
    }
    if (interaction === 'keyboard') {
      await toggle.press('Enter');
    } else if (interaction === 'touch') {
      await toggle.tap();
    } else {
      await toggle.click();
    }
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  }
}