using AgileTaskHub.Application.Projects;
using AgileTaskHub.Domain.Entities;
using AgileTaskHub.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AgileTaskHub.Api.Controllers;

[ApiController]
[Route("api/projects")]
[Authorize]
public sealed class ProjectsController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResult<ProjectResponse>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        if (page < 1 || pageSize is < 1 or > 100)
        {
            return BadRequest(new { message = "page must be at least 1 and pageSize must be between 1 and 100." });
        }

        var query = ProjectQueries.ApplySearch(dbContext.Projects.AsNoTracking(), search);
        var totalItems = await query.CountAsync(cancellationToken);
        var projects = await query
            .OrderBy(project => project.Name)
            .ThenBy(project => project.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var response = new PagedResult<ProjectResponse>(
            projects.Select(Map).ToList(),
            page,
            pageSize,
            totalItems,
            totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)pageSize));

        return Ok(response);
    }

    [HttpGet("{projectId:guid}")]
    public async Task<ActionResult<ProjectResponse>> GetById(Guid projectId, CancellationToken cancellationToken)
    {
        var project = await dbContext.Projects.AsNoTracking().SingleOrDefaultAsync(
            item => item.Id == projectId,
            cancellationToken);

        return project is null ? NotFound() : Ok(Map(project));
    }

    [HttpPost]
    public async Task<ActionResult<ProjectResponse>> Create(
        [FromBody] ProjectRequest request,
        CancellationToken cancellationToken)
    {
        var dateError = ProjectValidation.GetDateRangeError(request.StartDate, request.ExpectedEndDate);
        if (dateError is not null)
        {
            ModelState.AddModelError(nameof(request.ExpectedEndDate), dateError);
            return ValidationProblem(ModelState);
        }

        var normalizedName = request.Name.Trim();
        if (await NameExistsAsync(normalizedName, null, cancellationToken))
        {
            return Conflict(new { message = "A project with the same name already exists." });
        }

        var now = DateTime.UtcNow;
        var project = new Project
        {
            Id = Guid.NewGuid(),
            Name = normalizedName,
            Description = request.Description?.Trim() ?? string.Empty,
            StartDate = ToUtc(request.StartDate!.Value),
            ExpectedEndDate = ToUtc(request.ExpectedEndDate!.Value),
            Status = request.Status!.Value,
            CreatedAt = now,
            UpdatedAt = now
        };

        dbContext.Projects.Add(project);
        await dbContext.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetById), new { projectId = project.Id }, Map(project));
    }

    [HttpPut("{projectId:guid}")]
    public async Task<ActionResult<ProjectResponse>> Update(
        Guid projectId,
        [FromBody] ProjectRequest request,
        CancellationToken cancellationToken)
    {
        var dateError = ProjectValidation.GetDateRangeError(request.StartDate, request.ExpectedEndDate);
        if (dateError is not null)
        {
            ModelState.AddModelError(nameof(request.ExpectedEndDate), dateError);
            return ValidationProblem(ModelState);
        }

        var project = await dbContext.Projects.SingleOrDefaultAsync(item => item.Id == projectId, cancellationToken);
        if (project is null)
        {
            return NotFound();
        }

        var normalizedName = request.Name.Trim();
        if (await NameExistsAsync(normalizedName, projectId, cancellationToken))
        {
            return Conflict(new { message = "A project with the same name already exists." });
        }

        project.Name = normalizedName;
        project.Description = request.Description?.Trim() ?? string.Empty;
        project.StartDate = ToUtc(request.StartDate!.Value);
        project.ExpectedEndDate = ToUtc(request.ExpectedEndDate!.Value);
        project.Status = request.Status!.Value;
        project.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(Map(project));
    }

    [HttpDelete("{projectId:guid}")]
    public async Task<IActionResult> Delete(Guid projectId, CancellationToken cancellationToken)
    {
        var project = await dbContext.Projects.SingleOrDefaultAsync(item => item.Id == projectId, cancellationToken);
        if (project is null)
        {
            return NotFound();
        }

        dbContext.Projects.Remove(project);
        await dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private Task<bool> NameExistsAsync(string name, Guid? excludedId, CancellationToken cancellationToken)
    {
        var query = dbContext.Projects.AsNoTracking().Where(project => EF.Functions.ILike(project.Name, name));
        if (excludedId.HasValue)
        {
            query = query.Where(project => project.Id != excludedId.Value);
        }

        return query.AnyAsync(cancellationToken);
    }

    private static ProjectResponse Map(Project project) => new(
        project.Id,
        project.Name,
        project.Description,
        project.StartDate,
        project.ExpectedEndDate,
        project.Status,
        project.CreatedAt,
        project.UpdatedAt);

    private static DateTime ToUtc(DateTime value) => value.Kind switch
    {
        DateTimeKind.Utc => value,
        DateTimeKind.Local => value.ToUniversalTime(),
        _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
    };
}
