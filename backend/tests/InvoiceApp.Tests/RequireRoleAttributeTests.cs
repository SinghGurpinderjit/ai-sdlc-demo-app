using InvoiceApp.Api.Auth;
using InvoiceApp.Api.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;
using Xunit;

namespace InvoiceApp.Tests;

public class RequireRoleAttributeTests
{
    [Theory]
    [InlineData("Manager", true)]
    [InlineData("Director", true)]
    [InlineData("Approver", false)]
    [InlineData("Admin", false)]
    public void ApprovalsController_RequiresManagerOrDirector(string role, bool isAllowed)
    {
        var attribute = Assert.IsType<RequireRoleAttribute>(
            Attribute.GetCustomAttribute(typeof(ApprovalsController), typeof(RequireRoleAttribute)));

        AssertRoleAccess(attribute, role, isAllowed);
    }

    [Theory]
    [InlineData("Director", true)]
    [InlineData("Manager", false)]
    [InlineData("Approver", false)]
    [InlineData("Admin", false)]
    public void InvoiceDelete_RequiresDirector(string role, bool isAllowed)
    {
        var deleteMethod = typeof(InvoicesController).GetMethod(nameof(InvoicesController.Delete));
        var attribute = Assert.IsType<RequireRoleAttribute>(
            Attribute.GetCustomAttribute(deleteMethod!, typeof(RequireRoleAttribute)));

        AssertRoleAccess(attribute, role, isAllowed);
    }

    private static void AssertRoleAccess(RequireRoleAttribute attribute, string role, bool isAllowed)
    {
        var httpContext = new DefaultHttpContext();
        httpContext.Items[HttpContextExtensions.SessionKey] = new UserSession("demo.user", role);
        var actionContext = new ActionContext(httpContext, new RouteData(), new ActionDescriptor());
        var context = new ActionExecutingContext(
            actionContext,
            new List<IFilterMetadata>(),
            new Dictionary<string, object?>(),
            new object());

        attribute.OnActionExecuting(context);

        if (isAllowed)
        {
            Assert.Null(context.Result);
        }
        else
        {
            Assert.Equal(StatusCodes.Status403Forbidden, Assert.IsType<StatusCodeResult>(context.Result).StatusCode);
        }
    }
}