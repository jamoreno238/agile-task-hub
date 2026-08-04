using AgileTaskHub.Domain.Enums;

namespace AgileTaskHub.Application.Reports;

public sealed record ProjectReportDto(
    Guid ProjectId,
    string Name,
    string Description,
    ProjectStatus Status,
    DateTime StartDate,
    DateTime ExpectedEndDate,
    DateTime GeneratedAt,
    IReadOnlyList<ProjectReportTaskDto> Tasks);

public sealed record ProjectReportTaskDto(
    string Title,
    string ColumnName,
    string? ResponsibleName,
    TaskPriority Priority,
    DateTime CreatedAt);

public interface IProjectReportQuery
{
    Task<ProjectReportDto?> GetAsync(Guid projectId, CancellationToken cancellationToken = default);
}

public interface IProjectReportExporter
{
    string Format { get; }
    string ContentType { get; }
    string FileExtension { get; }
    byte[] Export(ProjectReportDto report);
}

public sealed record ProjectReportFile(
    byte[] Content,
    string ContentType,
    string FileName);

public interface IProjectReportExportService
{
    Task<ProjectReportFile?> ExportAsync(
        Guid projectId,
        string format,
        CancellationToken cancellationToken = default);
}

public sealed class UnsupportedProjectReportFormatException(string format)
    : InvalidOperationException($"Report format '{format}' is not supported.");
