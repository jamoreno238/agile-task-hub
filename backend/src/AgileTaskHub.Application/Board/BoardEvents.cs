namespace AgileTaskHub.Application.Board;

public static class BoardGroupNames
{
    public static string ForProject(Guid projectId) => $"board:{projectId}";
}

public static class BoardEventTypes
{
    public const string TaskCreated = "TaskCreated";
    public const string TaskUpdated = "TaskUpdated";
    public const string TaskDeleted = "TaskDeleted";
    public const string TaskMoved = "TaskMoved";
    public const string TasksReordered = "TasksReordered";
    public const string ColumnCreated = "ColumnCreated";
    public const string ColumnUpdated = "ColumnUpdated";
    public const string ColumnDeleted = "ColumnDeleted";
    public const string ColumnsReordered = "ColumnsReordered";
}

public sealed record BoardEvent(
    Guid ProjectId,
    Guid? ResourceId,
    string EventType,
    DateTime Timestamp,
    object? State);

public sealed record TaskPositionEventState(Guid TaskId, long Position);

public sealed record TasksReorderedEventState(
    Guid ColumnId,
    IReadOnlyList<TaskPositionEventState> Tasks);

public interface IBoardEventPublisher
{
    Task PublishAsync(BoardEvent boardEvent, CancellationToken cancellationToken = default);
}
