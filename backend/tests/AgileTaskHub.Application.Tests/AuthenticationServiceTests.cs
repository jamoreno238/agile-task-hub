using AgileTaskHub.Application.Persistence;
using AgileTaskHub.Application.Security;
using AgileTaskHub.Domain.Entities;

namespace AgileTaskHub.Application.Tests;

public sealed class AuthenticationServiceTests
{
    [Fact]
    public async Task AuthenticateAsync_returns_null_for_incorrect_password()
    {
        var user = CreateUser();
        var service = new AuthenticationService(
            new FakeUserRepository(user),
            new FakePasswordHasher(false),
            new FakeTokenService());

        var result = await service.AuthenticateAsync(user.Email, "wrong-password");

        Assert.Null(result);
    }

    [Fact]
    public async Task AuthenticateAsync_returns_user_and_token_for_valid_credentials()
    {
        var user = CreateUser();
        var service = new AuthenticationService(
            new FakeUserRepository(user),
            new FakePasswordHasher(true),
            new FakeTokenService());

        var result = await service.AuthenticateAsync("  ADMIN@EXAMPLE.COM ", "correct-password");

        Assert.NotNull(result);
        Assert.Equal(user.Id, result.UserId);
        Assert.Equal(user.Email, result.Email);
        Assert.Equal("token", result.AccessToken);
    }

    private static User CreateUser() => new()
    {
        Id = Guid.NewGuid(),
        Name = "Admin",
        Email = "admin@example.com",
        PasswordHash = "hash"
    };

    private sealed class FakeUserRepository(User user) : IUserRepository
    {
        public Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default) =>
            Task.FromResult<User?>(email == user.Email ? user : null);
    }

    private sealed class FakePasswordHasher(bool result) : IPasswordHasher
    {
        public string Hash(string password) => "hash";
        public bool Verify(string password, string encodedHash) => result;
    }

    private sealed class FakeTokenService : ITokenService
    {
        public AccessTokenResult CreateToken(User user) => new("token", DateTime.UtcNow.AddMinutes(30));
    }
}
