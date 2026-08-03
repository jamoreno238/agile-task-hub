using System.ComponentModel.DataAnnotations;
using AgileTaskHub.Domain.Enums;

namespace AgileTaskHub.Application.Board;

public sealed class ColumnRequest
{
    [Required]
    [StringLength(120)]
    public string Name { get; init; } = string.Empty;
}

public sealed class ColumnReorderRequest
{
    public IReadOnlyList<Guid> ColumnIds { get; init; } = Array.Empty<Guid>();
}

public sealed class CreateTaskRequest
{
    [Required]
    [StringLength(240)]
    public string Title { get; init; } = string.Empty;

    [StringLength(8000)]
    public string? Description { get; init; }

    [Required]
    [EnumDataType(typeof(TaskPriority))]
    public TaskPriority? Priority { get; init; }

    public Guid? ResponsibleUserId { get; init; }

    [Required]
    public Guid? ColumnId { get; init; }
}

public sealed class UpdateTaskRequest
{
    [Required]
    [StringLength(240)]
    public string Title { get; init; } = string.Empty;

    [StringLength(8000)]
    public string? Description { get; init; }

    [Required]
    [EnumDataType(typeof(TaskPriority))]
    public TaskPriority? Priority { get; init; }

    public Guid? ResponsibleUserId { get; init; }
}

public sealed class TaskMoveRequest
{
    [Required]
    public Guid? ColumnId { get; init; }

    [Range(0, int.MaxValue)]
    public int TargetIndex { get; init; }
}

public sealed record ColumnResponse(
    Guid Id,
    string Name,
    long Position,
    Guid ProjectId,
    DateTime CreatedAt);

public sealed record ResponsibleUserResponse(
    Guid Id,
    string Name,
    string Email);

public sealed record TaskResponse(
    Guid Id,
    string Title,
    string Description,
    TaskPriority Priority,
    Guid? ResponsibleUserId,
    ResponsibleUserResponse? ResponsibleUser,
    Guid ColumnId,
    long Position,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public sealed record BoardColumnResponse(
    Guid Id,
    string Name,
    long Position,
    Guid ProjectId,
    DateTime CreatedAt,
    IReadOnlyList<TaskResponse> Tasks);

public sealed record BoardResponse(
    Guid Id,
    string Name,
    string Description,
    DateTime StartDate,
    DateTime ExpectedEndDate,
    ProjectStatus Status,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    IReadOnlyList<BoardColumnResponse> Columns);
