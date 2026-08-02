using AgileTaskHub.Application.Persistence;

namespace AgileTaskHub.Application.Security;

public sealed class AuthenticationService(
    IUserRepository userRepository,
    IPasswordHasher passwordHasher,
    ITokenService tokenService) : IAuthenticationService
{
    public async Task<AuthenticationResult?> AuthenticateAsync(
        string email,
        string password,
        CancellationToken cancellationToken = default)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var user = await userRepository.GetByEmailAsync(normalizedEmail, cancellationToken);

        if (user is null || !passwordHasher.Verify(password, user.PasswordHash))
        {
            return null;
        }

        var token = tokenService.CreateToken(user);
        return new AuthenticationResult(user.Id, user.Name, user.Email, token.AccessToken, token.ExpiresAt);
    }
}
