using AgileTaskHub.Domain.Entities;

namespace AgileTaskHub.Application.Persistence;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
}
