using AgileTaskHub.Domain.Entities;

namespace AgileTaskHub.Application.Security;

public interface ITokenService
{
    AccessTokenResult CreateToken(User user);
}

public sealed record AccessTokenResult(string AccessToken, DateTime ExpiresAt);
