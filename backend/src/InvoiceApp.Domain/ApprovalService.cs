using System.Globalization;

namespace InvoiceApp.Domain;

/// <summary>
/// Moves an invoice through its lifecycle: Draft -> PendingApproval -> Approved or Rejected.
/// One invoice at a time, decided as a whole by a single approver.
/// </summary>
public class ApprovalService
{
    private const decimal ManagerApprovalLimit = 50_000m;
    private const decimal DirectorApprovalLimit = 500_000m;

    private readonly IInvoiceRepository _repository;

    public ApprovalService(IInvoiceRepository repository)
    {
        _repository = repository;
    }

    public Invoice Submit(string invoiceId)
    {
        var invoice = Find(invoiceId);

        if (invoice.Status != InvoiceStatus.Draft)
        {
            throw new InvalidOperationException(
                $"Invoice {invoiceId} is {invoice.Status}; only drafts can be submitted.");
        }

        invoice.Status = InvoiceStatus.PendingApproval;
        _repository.Update(invoice);
        return invoice;
    }

    public Invoice Approve(string invoiceId, string approver, string role)
    {
        var invoice = Find(invoiceId);
        EnsurePending(invoice);

        if (invoice.Amount > DirectorApprovalLimit)
        {
            ApproveEscalated(invoice, approver, role);
            _repository.Update(invoice);
            return invoice;
        }

        var limit = role switch
        {
            "Manager" => ManagerApprovalLimit,
            "Director" => DirectorApprovalLimit,
            _ => throw new InvalidOperationException($"Role '{role}' is not authorized to approve invoices.")
        };

        if (invoice.Amount > limit)
        {
            var formattedLimit = limit.ToString(CultureInfo.InvariantCulture);
            var formattedAmount = invoice.Amount.ToString(CultureInfo.InvariantCulture);
            throw new InvalidOperationException(
                $"{role} approval limit of {formattedLimit} was exceeded by invoice amount {formattedAmount}.");
        }

        invoice.ApprovalHistory.Add(CreateApprovalRecord(approver, role));
        invoice.Status = InvoiceStatus.Approved;
        invoice.DecidedBy = approver;
        invoice.DecidedAt = DateTime.UtcNow;
        _repository.Update(invoice);
        return invoice;
    }

    private static void ApproveEscalated(Invoice invoice, string approver, string role)
    {
        if (invoice.ApprovalHistory.Count == 0)
        {
            if (role is not ("Manager" or "Director"))
            {
                throw new InvalidOperationException($"Role '{role}' is not authorized to approve invoices.");
            }

            invoice.ApprovalHistory.Add(CreateApprovalRecord(approver, role));
            return;
        }

        if (invoice.ApprovalHistory.Any(approval =>
                string.Equals(approval.ApproverId, approver, StringComparison.OrdinalIgnoreCase)))
        {
            throw new InvalidOperationException("A different approver is required for the second approval.");
        }

        if (role != "Director")
        {
            throw new InvalidOperationException("The second approver must be a Director.");
        }

        if (invoice.ApprovalHistory.Count != 1)
        {
            throw new InvalidOperationException("This invoice already has the required approval history.");
        }

        var approval = CreateApprovalRecord(approver, role);
        invoice.ApprovalHistory.Add(approval);
        invoice.Status = InvoiceStatus.Approved;
        invoice.DecidedBy = approver;
        invoice.DecidedAt = approval.ApprovedAt;
    }

    private static ApprovalRecord CreateApprovalRecord(string approver, string role)
    {
        var approvedAt = DateTime.UtcNow;
        return new ApprovalRecord(approver, approver, role, approvedAt);
    }

    public Invoice Reject(string invoiceId, string approver, string reason)
    {
        if (string.IsNullOrWhiteSpace(reason))
        {
            throw new ArgumentException("A reason is required to reject an invoice.", nameof(reason));
        }

        var invoice = Find(invoiceId);
        EnsurePending(invoice);

        invoice.Status = InvoiceStatus.Rejected;
        invoice.DecidedBy = approver;
        invoice.DecidedAt = DateTime.UtcNow;
        invoice.DecisionNote = reason;
        _repository.Update(invoice);
        return invoice;
    }

    private Invoice Find(string invoiceId) =>
        _repository.GetById(invoiceId)
        ?? throw new KeyNotFoundException($"Invoice {invoiceId} was not found.");

    private static void EnsurePending(Invoice invoice)
    {
        if (invoice.Status != InvoiceStatus.PendingApproval)
        {
            throw new InvalidOperationException(
                $"Invoice {invoice.Id} is {invoice.Status}; only pending invoices can be decided.");
        }
    }
}
