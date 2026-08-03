using AgileTaskHub.Application.Board;
using AgileTaskHub.Domain.Entities;
using AgileTaskHub.Domain.Enums;

namespace AgileTaskHub.Application.Tests;

public sealed class BoardTests
{
    [Fact]
    public void PositionCalculator_calculates_a_position_between_two_tasks()
    {
        var result = PositionCalculator.Calculate(new long[] { 1024, 3072 }, 1);

        Assert.Equal(2048, result.Position);
        Assert.False(result.RequiresNormalization);
    }

    [Fact]
    public void PositionCalculator_calculates_a_position_at_the_end()
    {
        var result = PositionCalculator.Calculate(new long[] { 1024, 2048 }, 2);

        Assert.Equal(3072, result.Position);
        Assert.False(result.RequiresNormalization);
    }

    [Fact]
    public void PositionCalculator_requests_normalization_when_no_space_exists()
    {
        var result = PositionCalculator.Calculate(new long[] { 1024, 1025 }, 1);

        Assert.True(result.RequiresNormalization);
        Assert.Equal(new long[] { 1024, 2048, 3072 }, PositionCalculator.NormalizePositions(3));
    }

    [Fact]
    public void A_column_with_tasks_cannot_be_deleted()
    {
        var column = new BoardColumn { Id = Guid.NewGuid() };
        column.Tasks.Add(new TaskItem { Id = Guid.NewGuid(), ColumnId = column.Id });

        Assert.True(BoardRules.ColumnHasTasks(column.Tasks.Count));
    }

    [Fact]
    public void Priority_order_is_descending()
    {
        var tasks = CreateTasks(
            (TaskPriority.Low, 1024),
            (TaskPriority.Urgent, 2048),
            (TaskPriority.High, 3072),
            (TaskPriority.Medium, 4096));

        var result = BoardOrdering.SortByPriority(tasks);

        Assert.Equal(
            new[] { TaskPriority.Urgent, TaskPriority.High, TaskPriority.Medium, TaskPriority.Low },
            result.Select(task => task.Priority));
    }

    [Fact]
    public void Priority_order_preserves_relative_order_for_equal_priorities()
    {
        var tasks = CreateTasks(
            (TaskPriority.High, 1024),
            (TaskPriority.High, 2048),
            (TaskPriority.Low, 3072));

        var result = BoardOrdering.SortByPriority(tasks);

        Assert.Equal(tasks[0].Id, result[0].Id);
        Assert.Equal(tasks[1].Id, result[1].Id);
    }

    [Fact]
    public void Priority_order_does_not_change_column_id()
    {
        var firstColumnId = Guid.NewGuid();
        var secondColumnId = Guid.NewGuid();
        var tasks = new[]
        {
            new TaskItem { Id = Guid.NewGuid(), Priority = TaskPriority.Low, Position = 1024, ColumnId = firstColumnId },
            new TaskItem { Id = Guid.NewGuid(), Priority = TaskPriority.Urgent, Position = 2048, ColumnId = firstColumnId },
            new TaskItem { Id = Guid.NewGuid(), Priority = TaskPriority.High, Position = 1024, ColumnId = secondColumnId }
        };

        var result = BoardOrdering.SortByPriority(tasks);

        Assert.All(result, task => Assert.Equal(
            tasks.Single(original => original.Id == task.Id).ColumnId,
            task.ColumnId));
    }

    private static List<TaskItem> CreateTasks(params (TaskPriority Priority, long Position)[] values) =>
        values.Select(value => new TaskItem
        {
            Id = Guid.NewGuid(),
            Priority = value.Priority,
            Position = value.Position,
            ColumnId = Guid.NewGuid()
        }).ToList();
}
