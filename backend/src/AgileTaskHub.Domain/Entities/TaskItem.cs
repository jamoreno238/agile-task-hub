using AgileTaskHub.Domain.Enums;

namespace AgileTaskHub.Domain.Entities;

public class TaskItem
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public TaskPriority Priority { get; set; }
    public Guid? ResponsibleUserId { get; set; }
    public Guid ColumnId { get; set; }
    public long Position { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public User? ResponsibleUser { get; set; }
    public BoardColumn Column { get; set; } = null!;
}
