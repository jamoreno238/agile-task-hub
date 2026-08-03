using AgileTaskHub.Domain.Entities;

namespace AgileTaskHub.Application.Board;

public static class BoardOrdering
{
    public static IReadOnlyList<TaskItem> SortByPriority(IEnumerable<TaskItem> tasks)
    {
        // Enumerable.OrderBy is stable, so the original Position order is preserved
        // when both priority and position are equal.
        return tasks
            .OrderByDescending(task => task.Priority)
            .ThenBy(task => task.Position)
            .ToList();
    }
}
