using AgileTaskHub.Application.Persistence;
using AgileTaskHub.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AgileTaskHub.Infrastructure.Persistence;

public sealed class UserRepository(AppDbContext dbContext) : IUserRepository
{
    public Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        return dbContext.Users
            .AsNoTracking()
            .SingleOrDefaultAsync(user => EF.Functions.ILike(user.Email, email), cancellationToken);
    }
}
