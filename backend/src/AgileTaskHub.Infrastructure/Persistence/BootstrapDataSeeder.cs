using AgileTaskHub.Application.Security;
using AgileTaskHub.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace AgileTaskHub.Infrastructure.Persistence;

public static class BootstrapDataSeeder
{
    public static async Task EnsureAdminAsync(
        AppDbContext dbContext,
        IPasswordHasher passwordHasher,
        IConfiguration configuration,
        ILogger logger,
        CancellationToken cancellationToken = default)
    {
        var email = configuration["Admin:Email"] ?? configuration["Admin__Email"];
        var password = configuration["Admin:Password"] ?? configuration["Admin__Password"];

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            logger.LogWarning("Bootstrap admin was not created because Admin__Email or Admin__Password is missing.");
            return;
        }

        var normalizedEmail = email.Trim().ToLowerInvariant();
        if (await dbContext.Users.AnyAsync(user => user.Email == normalizedEmail, cancellationToken))
        {
            return;
        }

        dbContext.Users.Add(new User
        {
            Id = Guid.NewGuid(),
            Name = "Agile Task Hub Administrator",
            Email = normalizedEmail,
            PasswordHash = passwordHasher.Hash(password),
            CreatedAt = DateTime.UtcNow
        });

        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Bootstrap admin created for {Email}.", normalizedEmail);
    }
}
