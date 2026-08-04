using AgileTaskHub.Application.Reports;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AgileTaskHub.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/projects/{projectId:guid}/reports")]
public sealed class ReportsController(IProjectReportExportService reportService) : ControllerBase
{
    [HttpGet("pdf")]
    public Task<IActionResult> GetPdf(Guid projectId, CancellationToken cancellationToken) =>
        ExportAsync(projectId, "pdf", cancellationToken);

    [HttpGet("excel")]
    public Task<IActionResult> GetExcel(Guid projectId, CancellationToken cancellationToken) =>
        ExportAsync(projectId, "excel", cancellationToken);

    private async Task<IActionResult> ExportAsync(
        Guid projectId,
        string format,
        CancellationToken cancellationToken)
    {
        try
        {
            var report = await reportService.ExportAsync(projectId, format, cancellationToken);
            return report is null
                ? NotFound()
                : File(report.Content, report.ContentType, report.FileName);
        }
        catch (UnsupportedProjectReportFormatException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }
}
