using AgileTaskHub.Application.Reports;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace AgileTaskHub.Infrastructure.Reports;

public sealed class QuestPdfProjectReportExporter : IProjectReportExporter
{
    static QuestPdfProjectReportExporter()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public string Format => "pdf";
    public string ContentType => "application/pdf";
    public string FileExtension => ".pdf";

    public byte[] Export(ProjectReportDto report)
    {
        var document = Document.Create(container => container.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(32);
            page.DefaultTextStyle(style => style.FontSize(9));
            page.Header().Column(header =>
            {
                header.Item().Text("Agile Task Hub").FontSize(10).FontColor(Colors.Grey.Darken1);
                header.Item().Text(report.Name).FontSize(22).Bold().FontColor(Colors.Indigo.Darken2);
            });
            page.Content().Column(content =>
            {
                content.Spacing(8);
                content.Item().Text(report.Description is { Length: > 0 } description ? description : "Sin descripción.")
                    .FontColor(Colors.Grey.Darken2);
                content.Item().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.RelativeColumn(1.7f);
                        columns.RelativeColumn(1.1f);
                        columns.RelativeColumn(1.1f);
                        columns.RelativeColumn(1.1f);
                        columns.RelativeColumn(1.2f);
                    });

                    table.Header(header =>
                    {
                        HeaderCell(header.Cell()).Text("Estado");
                        HeaderCell(header.Cell()).Text("Fecha inicial");
                        HeaderCell(header.Cell()).Text("Fecha prevista");
                        HeaderCell(header.Cell()).Text("Generado");
                        HeaderCell(header.Cell()).Text("Tareas");
                    });

                    table.Cell().Element(Cell).Text(report.Status.ToString());
                    table.Cell().Element(Cell).Text(report.StartDate.ToString("yyyy-MM-dd"));
                    table.Cell().Element(Cell).Text(report.ExpectedEndDate.ToString("yyyy-MM-dd"));
                    table.Cell().Element(Cell).Text(report.GeneratedAt.ToString("yyyy-MM-dd HH:mm"));
                    table.Cell().Element(Cell).Text(report.Tasks.Count.ToString());
                });

                content.Item().PaddingTop(8).Text("Tareas").FontSize(14).Bold();
                content.Item().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.RelativeColumn(2.2f);
                        columns.RelativeColumn(1.2f);
                        columns.RelativeColumn(1.2f);
                        columns.RelativeColumn(1f);
                        columns.RelativeColumn(1.1f);
                    });

                    table.Header(header =>
                    {
                        HeaderCell(header.Cell()).Text("Título");
                        HeaderCell(header.Cell()).Text("Columna");
                        HeaderCell(header.Cell()).Text("Responsable");
                        HeaderCell(header.Cell()).Text("Prioridad");
                        HeaderCell(header.Cell()).Text("Creada");
                    });

                    foreach (var task in report.Tasks)
                    {
                        table.Cell().Element(Cell).Text(task.Title);
                        table.Cell().Element(Cell).Text(task.ColumnName);
                        table.Cell().Element(Cell).Text(task.ResponsibleName ?? "Sin responsable");
                        table.Cell().Element(Cell).Text(PriorityLabel(task.Priority));
                        table.Cell().Element(Cell).Text(task.CreatedAt.ToString("yyyy-MM-dd"));
                    }
                });
            });
            page.Footer().AlignCenter().Text(text =>
            {
                text.Span("Generado el ");
                text.Span(report.GeneratedAt.ToString("yyyy-MM-dd HH:mm"));
            });
        }));

        return document.GeneratePdf();
    }

    private static IContainer HeaderCell(IContainer container) =>
        container.Background(Colors.Indigo.Darken2).Padding(5).DefaultTextStyle(style => style.FontColor(Colors.White).Bold());

    private static IContainer Cell(IContainer container) =>
        container.BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(5);

    private static string PriorityLabel(Domain.Enums.TaskPriority priority) => priority switch
    {
        Domain.Enums.TaskPriority.Low => "Baja",
        Domain.Enums.TaskPriority.Medium => "Media",
        Domain.Enums.TaskPriority.High => "Alta",
        Domain.Enums.TaskPriority.Urgent => "Urgente",
        _ => priority.ToString()
    };
}
