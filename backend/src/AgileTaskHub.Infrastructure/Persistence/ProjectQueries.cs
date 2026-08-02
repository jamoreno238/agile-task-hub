using AgileTaskHub.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AgileTaskHub.Infrastructure.Persistence;

public static class ProjectQueries
{
    public static IQueryable<Project> ApplySearch(IQueryable<Project> query, string? search)
    {
        if (string.IsNullOrWhiteSpace(search))
        {
            return query;
        }

        var pattern = $"%{search.Trim().Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_")}%";
        return query.Where(project =>
            EF.Functions.ILike(project.Name, pattern, "\\") ||
            EF.Functions.ILike(project.Description, pattern, "\\"));
    }
}
