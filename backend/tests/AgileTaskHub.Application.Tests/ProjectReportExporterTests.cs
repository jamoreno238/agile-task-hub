using System.Text;
using AgileTaskHub.Application.Reports;
using AgileTaskHub.Domain.Enums;
using AgileTaskHub.Infrastructure.Reports;

namespace AgileTaskHub.Application.Tests;

public sealed class ProjectReportExporterTests
{
    [Fact]
    public void QuestPdf_exporter_generates_a_pdf_document()
    {
        var content = new QuestPdfProjectReportExporter().Export(CreateReport());

        Assert.True(content.Length > 4);
        Assert.Equal("%PDF", Encoding.ASCII.GetString(content, 0, 4));
    }

    [Fact]
    public void ClosedXml_exporter_generates_an_excel_package()
    {
        var content = new ClosedXmlProjectReportExporter().Export(CreateReport());

        Assert.True(content.Length > 4);
        Assert.Equal((byte)'P', content[0]);
        Assert.Equal((byte)'K', content[1]);
    }

    private static ProjectReportDto CreateReport() => new(
        Guid.NewGuid(),
        "Project",
        "Description",
        ProjectStatus.Active,
        DateTime.UtcNow.Date,
        DateTime.UtcNow.Date.AddDays(30),
        DateTime.UtcNow,
        [new ProjectReportTaskDto("Task", "Backlog", null, TaskPriority.Urgent, DateTime.UtcNow)]);
}
