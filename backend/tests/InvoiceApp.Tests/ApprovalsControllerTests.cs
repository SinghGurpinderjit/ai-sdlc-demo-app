using InvoiceApp.Api.Auth;
using InvoiceApp.Api.Controllers;
using InvoiceApp.Domain;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace InvoiceApp.Tests;

public class ApprovalsControllerTests
{
    [Fact]
    public void Approve_PreservesDomainLimitReasonInConflictResponse()
    {
        var invoice = new Invoice
        {
            Id = "INV-1",
            CustomerName = "Test School",
            Amount = 50_000.01m,
            Status = InvoiceStatus.PendingApproval
        };
        var controller = new ApprovalsController(new ApprovalService(new FakeInvoiceRepository(invoice)));
        var httpContext = new DefaultHttpContext();
        httpContext.Items[HttpContextExtensions.SessionKey] = new UserSession("demo.manager", "Manager");
        controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

        var result = controller.Approve("INV-1");

        var conflict = Assert.IsType<ConflictObjectResult>(result.Result);
        var error = conflict.Value!.GetType().GetProperty("error")!.GetValue(conflict.Value);
        Assert.Equal("Manager approval limit of 50000 was exceeded by invoice amount 50000.01.", error);
    }
}