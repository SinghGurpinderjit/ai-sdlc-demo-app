using InvoiceApp.Domain;
using Xunit;

namespace InvoiceApp.Tests;

public class ApprovalServiceTests
{
    private static Invoice InvoiceWith(string id, InvoiceStatus status) =>
        new() { Id = id, CustomerName = "Test School", Amount = 100m, Status = status };

    private static ApprovalService ServiceFor(params Invoice[] invoices) =>
        new(new FakeInvoiceRepository(invoices));

    [Fact]
    public void Submit_MovesDraftToPendingApproval()
    {
        var invoice = InvoiceWith("INV-1", InvoiceStatus.Draft);

        var result = ServiceFor(invoice).Submit("INV-1");

        Assert.Equal(InvoiceStatus.PendingApproval, result.Status);
    }

    [Fact]
    public void Submit_RejectsInvoiceThatIsNotADraft()
    {
        var service = ServiceFor(InvoiceWith("INV-1", InvoiceStatus.Approved));

        Assert.Throws<InvalidOperationException>(() => service.Submit("INV-1"));
    }

    [Fact]
    public void Approve_SetsStatusApproverAndTimestamp()
    {
        var service = ServiceFor(InvoiceWith("INV-1", InvoiceStatus.PendingApproval));

        var result = service.Approve("INV-1", "demo.manager", "Manager");

        Assert.Equal(InvoiceStatus.Approved, result.Status);
        Assert.Equal("demo.manager", result.DecidedBy);
        Assert.NotNull(result.DecidedAt);
    }

    [Fact]
    public void Approve_RejectsInvoiceThatIsStillADraft()
    {
        var service = ServiceFor(InvoiceWith("INV-1", InvoiceStatus.Draft));

        Assert.Throws<InvalidOperationException>(() => service.Approve("INV-1", "demo.manager", "Manager"));
    }

    [Fact]
    public void Approve_ThrowsWhenInvoiceDoesNotExist()
    {
        var service = ServiceFor();

        Assert.Throws<KeyNotFoundException>(() => service.Approve("INV-404", "demo.manager", "Manager"));
    }

    [Fact]
    public void Approve_ManagerCanApproveAtInclusiveLimit()
    {
        var invoice = InvoiceWith("INV-1", InvoiceStatus.PendingApproval);
        invoice.Amount = 50_000m;

        var result = ServiceFor(invoice).Approve("INV-1", "demo.manager", "Manager");

        Assert.Equal(InvoiceStatus.Approved, result.Status);
        Assert.Equal("demo.manager", result.DecidedBy);
        Assert.NotNull(result.DecidedAt);
    }

    [Fact]
    public void Approve_DirectorCanApproveAtInclusiveLimit()
    {
        var invoice = InvoiceWith("INV-1", InvoiceStatus.PendingApproval);
        invoice.Amount = 500_000m;

        var result = ServiceFor(invoice).Approve("INV-1", "demo.director", "Director");

        Assert.Equal(InvoiceStatus.Approved, result.Status);
        Assert.Equal("demo.director", result.DecidedBy);
        Assert.NotNull(result.DecidedAt);
    }

    [Theory]
    [InlineData("Manager", 50_000.01, "Manager approval limit of 50000 was exceeded by invoice amount 50000.01.")]
    [InlineData("Director", 500_000.01, "Director approval limit of 500000 was exceeded by invoice amount 500000.01.")]
    public void Approve_OverLimitLeavesDecisionFieldsUnchanged(string role, decimal amount, string expectedReason)
    {
        var decidedAt = new DateTime(2025, 1, 2, 3, 4, 5, DateTimeKind.Utc);
        var invoice = InvoiceWith("INV-1", InvoiceStatus.PendingApproval);
        invoice.Amount = amount;
        invoice.DecidedBy = "previous-actor";
        invoice.DecidedAt = decidedAt;
        invoice.DecisionNote = "previous decision";
        var service = ServiceFor(invoice);

        var error = Assert.Throws<InvalidOperationException>(
            () => service.Approve("INV-1", "attempted-actor", role));

        Assert.Equal(expectedReason, error.Message);
        Assert.Equal(InvoiceStatus.PendingApproval, invoice.Status);
        Assert.Equal("previous-actor", invoice.DecidedBy);
        Assert.Equal(decidedAt, invoice.DecidedAt);
        Assert.Equal("previous decision", invoice.DecisionNote);
    }

    [Fact]
    public void Approve_RejectsUnknownRoleWithoutChangingDecisionFields()
    {
        var invoice = InvoiceWith("INV-1", InvoiceStatus.PendingApproval);
        invoice.DecidedBy = "previous-actor";
        var service = ServiceFor(invoice);

        var error = Assert.Throws<InvalidOperationException>(
            () => service.Approve("INV-1", "attempted-actor", "Approver"));

        Assert.Equal("Role 'Approver' is not authorized to approve invoices.", error.Message);
        Assert.Equal(InvoiceStatus.PendingApproval, invoice.Status);
        Assert.Equal("previous-actor", invoice.DecidedBy);
        Assert.Null(invoice.DecidedAt);
        Assert.Null(invoice.DecisionNote);
    }

    [Fact]
    public void Reject_RecordsReasonAndApprover()
    {
        var service = ServiceFor(InvoiceWith("INV-1", InvoiceStatus.PendingApproval));

        var result = service.Reject("INV-1", "demo.approver", "Duplicate invoice");

        Assert.Equal(InvoiceStatus.Rejected, result.Status);
        Assert.Equal("Duplicate invoice", result.DecisionNote);
    }

    [Fact]
    public void Reject_RequiresAReason()
    {
        var service = ServiceFor(InvoiceWith("INV-1", InvoiceStatus.PendingApproval));

        Assert.Throws<ArgumentException>(() => service.Reject("INV-1", "demo.approver", "  "));
    }
}
