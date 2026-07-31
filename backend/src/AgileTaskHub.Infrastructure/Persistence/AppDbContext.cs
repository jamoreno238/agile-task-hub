using AgileTaskHub.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AgileTaskHub.Infrastructure.Persistence;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options, bool includeSeedData = true) : DbContext(options)
{
    private readonly bool _includeSeedData = includeSeedData;

    public DbSet<User> Users => Set<User>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<BoardColumn> BoardColumns => Set<BoardColumn>();
    public DbSet<TaskItem> TaskItems => Set<TaskItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        if (_includeSeedData)
        {
            SeedData.Apply(modelBuilder);
        }

        base.OnModelCreating(modelBuilder);
    }
}
