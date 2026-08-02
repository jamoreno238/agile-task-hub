using System.IdentityModel.Tokens.Jwt;
using AgileTaskHub.Application.Security;
using AgileTaskHub.Domain.Entities;
using AgileTaskHub.Infrastructure.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;

namespace AgileTaskHub.Application.Tests;

public sealed class SecurityAdapterTests
{
    [Fact]
    public void SecurePasswordHasher_verifies_only_the_original_password()
    {
        var configuration = new ConfigurationManager
        {
            ["Security:PasswordPepper"] = "test-pepper"
        };
        var hasher = new SecurePasswordHasher(configuration);
        var hash = hasher.Hash("Admin123*");

        Assert.True(hasher.Verify("Admin123*", hash));
        Assert.False(hasher.Verify("wrong", hash));
        Assert.NotEqual("Admin123*", hash);
    }

    [Fact]
    public void JwtTokenService_includes_required_claims_and_expiration()
    {
        var options = Options.Create(new JwtOptions
        {
            Secret = "a-secret-with-at-least-32-characters-long",
            Issuer = "test-issuer",
            Audience = "test-audience",
            ExpirationMinutes = 30
        });
        var user = new User { Id = Guid.NewGuid(), Name = "Admin", Email = "admin@example.com" };
        var result = new JwtTokenService(options).CreateToken(user);
        var token = new JwtSecurityTokenHandler().ReadJwtToken(result.AccessToken);

        Assert.Equal(user.Id.ToString(), token.Subject);
        Assert.Equal(user.Email, token.Claims.Single(claim => claim.Type == JwtRegisteredClaimNames.Email).Value);
        Assert.Equal(user.Name, token.Claims.Single(claim => claim.Type == JwtRegisteredClaimNames.Name).Value);
        Assert.Equal("test-issuer", token.Issuer);
        Assert.Contains("test-audience", token.Audiences);
        Assert.True(token.ValidTo > DateTime.UtcNow);
    }
}

