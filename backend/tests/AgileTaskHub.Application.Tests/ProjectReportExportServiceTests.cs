using AgileTaskHub.Application.Reports;
using AgileTaskHub.Domain.Enums;

namespace AgileTaskHub.Application.Tests;

public sealed class ProjectReportExportServiceTests
{
    [Fact]
    public async Task Selects_the_exporter_matching_the_requested_format()
    {
        var report = CreateReport();
        var query = new FakeReportQuery(report);
        var pdf = new FakeExporter("pdf", ".pdf");
        var excel = new FakeExporter("excel", ".xlsx");
        var service = new ProjectReportExportService(query, [pdf, excel]);

        var file = await service.ExportAsync(report.ProjectId, "EXCEL");

        Assert.NotNull(file);
        Assert.Equal(".xlsx", Path.GetExtension(file.FileName));
        Assert.Equal(0, pdf.ExportCount);
        Assert.Equal(1, excel.ExportCount);
    }

    [Fact]
    public async Task Both_exporters_receive_the_same_report_dto()
    {
        var report = CreateReport();
        var query = new FakeReportQuery(report);
        var pdf = new FakeExporter("pdf", ".pdf");
        var excel = new FakeExporter("excel", ".xlsx");
        var service = new ProjectReportExportService(query, [pdf, excel]);

        await service.ExportAsync(report.ProjectId, "pdf");
        await service.ExportAsync(report.ProjectId, "excel");

        Assert.Same(report, pdf.ReceivedReport);
        Assert.Same(report, excel.ReceivedReport);
    }

    [Fact]
    public async Task Queries_the_report_data_once_per_export()
    {
        var report = CreateReport();
        var query = new FakeReportQuery(report);
        var service = new ProjectReportExportService(query, [new FakeExporter("pdf", ".pdf")]);

        await service.ExportAsync(report.ProjectId, "pdf");

        Assert.Equal(1, query.CallCount);
    }

    private static ProjectReportDto CreateReport() => new(
        Guid.NewGuid(),
        "Project",
        "Description",
        ProjectStatus.Active,
        DateTime.UtcNow.Date,
        DateTime.UtcNow.Date.AddDays(30),
        DateTime.UtcNow,
        [new ProjectReportTaskDto("Task", "Backlog", "Owner", TaskPriority.High, DateTime.UtcNow)]);

    private sealed class FakeReportQuery(ProjectReportDto report) : IProjectReportQuery
    {
        public int CallCount { get; private set; }

        public Task<ProjectReportDto?> GetAsync(Guid projectId, CancellationToken cancellationToken = default)
        {
            CallCount++;
            return Task.FromResult<ProjectReportDto?>(report);
        }
    }

    private sealed class FakeExporter(string format, string fileExtension) : IProjectReportExporter
    {
        public string Format => format;
        public string ContentType => "application/octet-stream";
        public string FileExtension => fileExtension;
        public int ExportCount { get; private set; }
        public ProjectReportDto? ReceivedReport { get; private set; }

        public byte[] Export(ProjectReportDto report)
        {
            ExportCount++;
            ReceivedReport = report;
            return [1, 2, 3];
        }
    }
}
