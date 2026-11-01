using InvoiceApp.Api.Auth;
using InvoiceApp.Api.Controllers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System.Text.Json;
using Xunit;

namespace InvoiceApp.Tests;

public class AuthControllerTests
{
    [Theory]
    [InlineData("demo.approver", "Manager")]
    [InlineData("demo.admin", "Director")]
    public void Login_ReturnsAndStoresConfiguredRole(string username, string role)
    {
        var sessions = new SessionStore();
        var usersOptions = LoadDemoUsersOptions();
        var configuredUser = usersOptions.Users.Single(user => user.Username == username);
        var controller = new AuthController(Options.Create(usersOptions), sessions);

        Assert.Equal(role, configuredUser.Role);
        var result = controller.Login(new AuthController.LoginRequest(username, configuredUser.Password));

        var response = Assert.IsType<AuthController.LoginResponse>(Assert.IsType<OkObjectResult>(result.Result).Value);
        Assert.Equal(role, response.Role);
        Assert.Equal(role, sessions.Get(response.Token)?.Role);
    }

    private static DemoUsersOptions LoadDemoUsersOptions()
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);
        while (directory is not null)
        {
            var settingsPath = Path.Combine(directory.FullName, "backend", "src", "InvoiceApp.Api", "appsettings.json");
            if (File.Exists(settingsPath))
            {
                return JsonSerializer.Deserialize<DemoUsersOptions>(File.ReadAllText(settingsPath))
                    ?? throw new InvalidOperationException("Demo user configuration could not be loaded.");
            }

            directory = directory.Parent;
        }

        throw new FileNotFoundException("Could not locate the API demo user configuration.");
    }
}