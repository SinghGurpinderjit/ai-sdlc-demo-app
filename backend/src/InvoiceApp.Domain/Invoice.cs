namespace InvoiceApp.Domain;

public sealed record ApprovalRecord(string ApproverId, string ApproverName, string Role, DateTime ApprovedAt);

public class Invoice
{
    public string Id { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public InvoiceStatus Status { get; set; } = InvoiceStatus.Draft;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? DecidedBy { get; set; }
    public DateTime? DecidedAt { get; set; }
    public string? DecisionNote { get; set; }
    public List<ApprovalRecord> ApprovalHistory { get; set; } = new();
    public string? ApprovalProgress => Amount > 500_000m
        ? Status switch
        {
            InvoiceStatus.Approved => "Approved 2/2",
            InvoiceStatus.PendingApproval when ApprovalHistory.Count == 0 => "0/2 - First approval needed",
            InvoiceStatus.PendingApproval when ApprovalHistory.Count == 1 => "1/2 - Director approval needed",
            _ => null
        }
        : null;
}
