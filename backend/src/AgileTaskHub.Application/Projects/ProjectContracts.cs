using System.ComponentModel.DataAnnotations;
using AgileTaskHub.Domain.Enums;

namespace AgileTaskHub.Application.Projects;

public sealed class ProjectRequest
{
    [Required]
    [StringLength(180)]
    public string Name { get; init; } = string.Empty;

    [StringLength(4000)]
    public string? Description { get; init; }

    [Required]
    public DateTime? StartDate { get; init; }

    [Required]
    public DateTime? ExpectedEndDate { get; init; }

    [Required]
    [EnumDataType(typeof(ProjectStatus))]
    public ProjectStatus? Status { get; init; }
}

public sealed record ProjectResponse(
    Guid Id,
    string Name,
    string Description,
    DateTime StartDate,
    DateTime ExpectedEndDate,
    ProjectStatus Status,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public sealed record PagedResult<T>(
    IReadOnlyList<T> Items,
    int Page,
    int PageSize,
    int TotalItems,
    int TotalPages);

public static class ProjectValidation
{
    public static string? GetDateRangeError(DateTime? startDate, DateTime? expectedEndDate)
    {
        if (startDate.HasValue && expectedEndDate.HasValue && expectedEndDate.Value < startDate.Value)
        {
            return "ExpectedEndDate cannot be earlier than StartDate.";
        }

        return null;
    }
}
