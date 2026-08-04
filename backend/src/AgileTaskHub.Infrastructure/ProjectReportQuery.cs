using AgileTaskHub.Application.Reports;
using Microsoft.EntityFrameworkCore;

namespace AgileTaskHub.Infrastructure.Persistence;

public sealed class ProjectReportQuery(AppDbContext dbContext) : IProjectReportQuery
{
    public async Task<ProjectReportDto?> GetAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        // One PostgreSQL query loads the project graph needed by both exporters.
        var project = await dbContext.Projects
            .AsNoTracking()
            .Include(item => item.Columns)
            .ThenInclude(column => column.Tasks)
            .ThenInclude(task => task.ResponsibleUser)
            .SingleOrDefaultAsync(item => item.Id == projectId, cancellationToken);

        if (project is null)
        {
            return null;
        }

        var tasks = project.Columns
            .OrderBy(column => column.Position)
            .ThenBy(column => column.Id)
            .SelectMany(column => column.Tasks
                .OrderBy(task => task.Position)
                .ThenBy(task => task.Id)
                .Select(task => new ProjectReportTaskDto(
                    task.Title,
                    column.Name,
                    task.ResponsibleUser?.Name,
                    task.Priority,
                    task.CreatedAt)))
            .ToList();

        return new ProjectReportDto(
            project.Id,
            project.Name,
            project.Description,
            project.Status,
            project.StartDate,
            project.ExpectedEndDate,
            DateTime.UtcNow,
            tasks);
    }
}
