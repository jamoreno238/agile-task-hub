using AgileTaskHub.Domain.Enums;

namespace AgileTaskHub.Domain.Entities;

public class Project
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime ExpectedEndDate { get; set; }
    public ProjectStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<BoardColumn> Columns { get; } = new List<BoardColumn>();
}
