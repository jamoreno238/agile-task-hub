namespace AgileTaskHub.Application.Security;

public interface IAuthenticationService
{
    Task<AuthenticationResult?> AuthenticateAsync(
        string email,
        string password,
        CancellationToken cancellationToken = default);
}

public sealed record AuthenticationResult(
    Guid UserId,
    string Name,
    string Email,
    string AccessToken,
    DateTime ExpiresAt);
