using AgileTaskHub.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AgileTaskHub.Infrastructure.Persistence;

internal static class SeedData
{
    private static readonly DateTime SeedDate = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    public static void Apply(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>().HasData(
            new User
            {
                Id = new Guid("f7b0f4bb-25bc-4b87-a8d4-7de5f0040001"),
                Name = "Agile Task Hub Owner",
                Email = "owner@agile-task-hub.local",
                PasswordHash = "v1.JOMo7Jkybi9GhW/uPApraQ==.HOVybW9avt0RcZZip2oKOj06GljMTbdFwQ6CPHiSBqTqqvY4Uq4PsaNJvErcMFbMh4V1NHnMSa4RPlkqvMGMHA==",
                CreatedAt = SeedDate
            },
            new User
            {
                Id = new Guid("f7b0f4bb-25bc-4b87-a8d4-7de5f0040002"),
                Name = "Agile Task Hub Member",
                Email = "member@agile-task-hub.local",
                PasswordHash = "v1.dSopjLk51NVU1F24mVY5BA==.E5MgFcI9SSXmMsCHTtdefya4vrEmVbhlf7VKYBmXqTHx2BTXZGE7o7EEbHfAywxmNPbSCEj6ESCehMgJaEL5ZQ==",
                CreatedAt = SeedDate
            });
    }
}
