namespace AgileTaskHub.Application.Reports;

public sealed class ProjectReportExportService(
    IProjectReportQuery reportQuery,
    IEnumerable<IProjectReportExporter> exporters) : IProjectReportExportService
{
    public async Task<ProjectReportFile?> ExportAsync(
        Guid projectId,
        string format,
        CancellationToken cancellationToken = default)
    {
        var exporter = exporters.FirstOrDefault(item =>
            string.Equals(item.Format, format, StringComparison.OrdinalIgnoreCase));
        if (exporter is null)
        {
            throw new UnsupportedProjectReportFormatException(format);
        }

        // The query is executed once and the same DTO is passed to the selected strategy.
        var report = await reportQuery.GetAsync(projectId, cancellationToken);
        if (report is null)
        {
            return null;
        }

        return new ProjectReportFile(
            exporter.Export(report),
            exporter.ContentType,
            $"agile-task-hub-project-{report.ProjectId}{exporter.FileExtension}");
    }
}
