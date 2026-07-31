namespace AgileTaskHub.Domain.Entities;

public class BoardColumn
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public long Position { get; set; }
    public Guid ProjectId { get; set; }
    public DateTime CreatedAt { get; set; }

    public Project Project { get; set; } = null!;
    public ICollection<TaskItem> Tasks { get; } = new List<TaskItem>();
}
