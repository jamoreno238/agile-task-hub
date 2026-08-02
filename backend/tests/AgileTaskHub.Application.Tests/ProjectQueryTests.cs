using AgileTaskHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AgileTaskHub.Application.Tests;

public sealed class ProjectQueryTests
{
    [Fact]
    public void Project_search_is_translated_to_postgres_ilike()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql("Host=localhost;Database=agile_task_hub;Username=test;Password=test")
            .Options;
        using var dbContext = new AppDbContext(options, includeSeedData: false);

        var sql = ProjectQueries.ApplySearch(dbContext.Projects, "scrum").ToQueryString();

        Assert.Contains("ILIKE", sql, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("%scrum%", sql, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Project_list_query_contains_server_side_order_skip_and_take()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql("Host=localhost;Database=agile_task_hub;Username=test;Password=test")
            .Options;
        using var dbContext = new AppDbContext(options, includeSeedData: false);

        var sql = dbContext.Projects
            .OrderBy(project => project.Name)
            .Skip(20)
            .Take(10)
            .ToQueryString();

        Assert.Contains("LIMIT", sql, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("OFFSET", sql, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("ORDER BY", sql, StringComparison.OrdinalIgnoreCase);
    }
}

