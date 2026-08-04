using AgileTaskHub.Application.Reports;
using ClosedXML.Excel;

namespace AgileTaskHub.Infrastructure.Reports;

public sealed class ClosedXmlProjectReportExporter : IProjectReportExporter
{
    public string Format => "excel";
    public string ContentType => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    public string FileExtension => ".xlsx";

    public byte[] Export(ProjectReportDto report)
    {
        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Project report");
        worksheet.Cell(1, 1).Value = "Agile Task Hub - Project report";
        worksheet.Range(1, 1, 1, 2).Merge();
        worksheet.Cell(1, 1).Style.Font.Bold = true;
        worksheet.Cell(1, 1).Style.Font.FontSize = 16;

        worksheet.Cell(3, 1).Value = "Proyecto";
        worksheet.Cell(3, 2).Value = report.Name;
        worksheet.Cell(4, 1).Value = "Descripción";
        worksheet.Cell(4, 2).Value = report.Description;
        worksheet.Cell(5, 1).Value = "Estado";
        worksheet.Cell(5, 2).Value = report.Status.ToString();
        worksheet.Cell(6, 1).Value = "Fecha inicial";
        worksheet.Cell(6, 2).Value = report.StartDate;
        worksheet.Cell(7, 1).Value = "Fecha prevista";
        worksheet.Cell(7, 2).Value = report.ExpectedEndDate;
        worksheet.Cell(8, 1).Value = "Generado";
        worksheet.Cell(8, 2).Value = report.GeneratedAt;
        worksheet.Range(3, 1, 8, 1).Style.Font.Bold = true;
        worksheet.Range(6, 2, 8, 2).Style.DateFormat.Format = "yyyy-mm-dd hh:mm";

        const int headerRow = 10;
        var headers = new[] { "Título", "Columna", "Responsable", "Prioridad", "Creada" };
        for (var index = 0; index < headers.Length; index++)
        {
            worksheet.Cell(headerRow, index + 1).Value = headers[index];
        }

        worksheet.Range(headerRow, 1, headerRow, headers.Length).Style.Font.Bold = true;
        worksheet.Range(headerRow, 1, headerRow, headers.Length).Style.Fill.SetBackgroundColor(XLColor.Indigo);
        worksheet.Range(headerRow, 1, headerRow, headers.Length).Style.Font.FontColor = XLColor.White;

        for (var index = 0; index < report.Tasks.Count; index++)
        {
            var task = report.Tasks[index];
            var row = headerRow + index + 1;
            worksheet.Cell(row, 1).Value = task.Title;
            worksheet.Cell(row, 2).Value = task.ColumnName;
            worksheet.Cell(row, 3).Value = task.ResponsibleName ?? "Sin responsable";
            worksheet.Cell(row, 4).Value = PriorityLabel(task.Priority);
            worksheet.Cell(row, 5).Value = task.CreatedAt;
            worksheet.Cell(row, 5).Style.DateFormat.Format = "yyyy-mm-dd";
        }

        worksheet.SheetView.FreezeRows(headerRow);
        worksheet.Columns().AdjustToContents();
        worksheet.Column(1).Width = Math.Min(48, Math.Max(18, worksheet.Column(1).Width));
        worksheet.Column(2).Width = Math.Min(24, Math.Max(14, worksheet.Column(2).Width));

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    private static string PriorityLabel(Domain.Enums.TaskPriority priority) => priority switch
    {
        Domain.Enums.TaskPriority.Low => "Baja",
        Domain.Enums.TaskPriority.Medium => "Media",
        Domain.Enums.TaskPriority.High => "Alta",
        Domain.Enums.TaskPriority.Urgent => "Urgente",
        _ => priority.ToString()
    };
}
