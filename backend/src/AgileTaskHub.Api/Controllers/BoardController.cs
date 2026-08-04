using AgileTaskHub.Application.Board;
using AgileTaskHub.Domain.Entities;
using AgileTaskHub.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AgileTaskHub.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/projects/{projectId:guid}")]
public sealed class BoardController(
    AppDbContext dbContext,
    IBoardEventPublisher boardEventPublisher) : ControllerBase
{
    [HttpGet("board")]
    public async Task<ActionResult<BoardResponse>> GetBoard(Guid projectId, CancellationToken cancellationToken)
    {
        var project = await LoadProjectWithBoardAsync(projectId, cancellationToken);
        return project is null ? NotFound() : Ok(MapBoard(project));
    }

    [HttpGet("columns")]
    public async Task<ActionResult<IReadOnlyList<ColumnResponse>>> GetColumns(
        Guid projectId,
        CancellationToken cancellationToken)
    {
        if (!await ProjectExistsAsync(projectId, cancellationToken))
        {
            return NotFound();
        }

        var columns = await dbContext.BoardColumns
            .AsNoTracking()
            .Where(column => column.ProjectId == projectId)
            .OrderBy(column => column.Position)
            .ThenBy(column => column.Id)
            .Select(column => new ColumnResponse(
                column.Id,
                column.Name,
                column.Position,
                column.ProjectId,
                column.CreatedAt))
            .ToListAsync(cancellationToken);

        return Ok(columns);
    }

    [HttpPost("columns")]
    public async Task<ActionResult<ColumnResponse>> CreateColumn(
        Guid projectId,
        [FromBody] ColumnRequest request,
        CancellationToken cancellationToken)
    {
        if (!ValidateColumn(request))
        {
            return ValidationProblem(ModelState);
        }

        if (!await ProjectExistsAsync(projectId, cancellationToken))
        {
            return NotFound();
        }

        var columns = await dbContext.BoardColumns
            .Where(column => column.ProjectId == projectId)
            .OrderBy(column => column.Position)
            .ThenBy(column => column.Id)
            .ToListAsync(cancellationToken);
        var calculation = PositionCalculator.Calculate(
            columns.Select(column => column.Position).ToArray(),
            columns.Count);

        var now = DateTime.UtcNow;
        if (calculation.RequiresNormalization)
        {
            AssignNormalizedPositions(columns, now);
            calculation = PositionCalculator.Calculate(
                PositionCalculator.NormalizePositions(columns.Count),
                columns.Count);
        }

        var column = new BoardColumn
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Position = calculation.Position,
            ProjectId = projectId,
            CreatedAt = now
        };

        dbContext.BoardColumns.Add(column);
        await dbContext.SaveChangesAsync(cancellationToken);

        var response = MapColumn(column);
        await PublishAsync(projectId, BoardEventTypes.ColumnCreated, column.Id, response, cancellationToken);
        return Created($"/api/projects/{projectId}/columns/{column.Id}", response);
    }

    [HttpPut("columns/{columnId:guid}")]
    public async Task<ActionResult<ColumnResponse>> UpdateColumn(
        Guid projectId,
        Guid columnId,
        [FromBody] ColumnRequest request,
        CancellationToken cancellationToken)
    {
        if (!ValidateColumn(request))
        {
            return ValidationProblem(ModelState);
        }

        var column = await dbContext.BoardColumns
            .SingleOrDefaultAsync(item => item.Id == columnId && item.ProjectId == projectId, cancellationToken);
        if (column is null)
        {
            return NotFound();
        }

        column.Name = request.Name.Trim();
        await dbContext.SaveChangesAsync(cancellationToken);
        var response = MapColumn(column);
        await PublishAsync(projectId, BoardEventTypes.ColumnUpdated, column.Id, response, cancellationToken);
        return Ok(response);
    }

    [HttpDelete("columns/{columnId:guid}")]
    public async Task<IActionResult> DeleteColumn(
        Guid projectId,
        Guid columnId,
        CancellationToken cancellationToken)
    {
        var column = await dbContext.BoardColumns
            .SingleOrDefaultAsync(item => item.Id == columnId && item.ProjectId == projectId, cancellationToken);
        if (column is null)
        {
            return NotFound();
        }

        var taskCount = await dbContext.TaskItems.CountAsync(task => task.ColumnId == columnId, cancellationToken);
        if (BoardRules.ColumnHasTasks(taskCount))
        {
            return Conflict(new
            {
                code = "COLUMN_NOT_EMPTY",
                message = "No se puede eliminar una columna que contiene tareas."
            });
        }

        dbContext.BoardColumns.Remove(column);
        await dbContext.SaveChangesAsync(cancellationToken);
        await PublishAsync(projectId, BoardEventTypes.ColumnDeleted, columnId, null, cancellationToken);
        return NoContent();
    }

    [HttpPatch("columns/reorder")]
    public async Task<ActionResult<IReadOnlyList<ColumnResponse>>> ReorderColumns(
        Guid projectId,
        [FromBody] ColumnReorderRequest request,
        CancellationToken cancellationToken)
    {
        var columns = await dbContext.BoardColumns
            .Where(column => column.ProjectId == projectId)
            .OrderBy(column => column.Position)
            .ThenBy(column => column.Id)
            .ToListAsync(cancellationToken);
        if (columns.Count == 0 && !await ProjectExistsAsync(projectId, cancellationToken))
        {
            return NotFound();
        }

        var requestedIds = request.ColumnIds;
        var knownIds = columns.Select(column => column.Id).ToHashSet();
        if (requestedIds.Count != columns.Count || requestedIds.Distinct().Count() != requestedIds.Count ||
            !knownIds.SetEquals(requestedIds))
        {
            return BadRequest(new { message = "ColumnIds must contain every project column exactly once." });
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        for (var index = 0; index < requestedIds.Count; index++)
        {
            columns.Single(column => column.Id == requestedIds[index]).Position =
                PositionCalculator.PositionAtIndex(index);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        var response = columns
            .OrderBy(column => column.Position)
            .ThenBy(column => column.Id)
            .Select(MapColumn)
            .ToList();
        await PublishAsync(projectId, BoardEventTypes.ColumnsReordered, null, response, cancellationToken);
        return Ok(response);
    }

    [HttpPost("tasks")]
    public async Task<ActionResult<TaskResponse>> CreateTask(
        Guid projectId,
        [FromBody] CreateTaskRequest request,
        CancellationToken cancellationToken)
    {
        if (!ValidateTask(request.Title, request.Priority))
        {
            return ValidationProblem(ModelState);
        }

        if (!await ProjectExistsAsync(projectId, cancellationToken))
        {
            return NotFound();
        }

        var column = await dbContext.BoardColumns
            .SingleOrDefaultAsync(item => item.Id == request.ColumnId && item.ProjectId == projectId, cancellationToken);
        if (column is null)
        {
            return BadRequest(new { message = "ColumnId must belong to the project." });
        }

        if (!await ValidateResponsibleUserAsync(request.ResponsibleUserId, cancellationToken))
        {
            return ValidationProblem(ModelState);
        }

        var tasks = await dbContext.TaskItems
            .Where(task => task.ColumnId == column.Id)
            .OrderBy(task => task.Position)
            .ThenBy(task => task.Id)
            .ToListAsync(cancellationToken);
        var calculation = PositionCalculator.Calculate(
            tasks.Select(task => task.Position).ToArray(),
            tasks.Count);
        var now = DateTime.UtcNow;
        if (calculation.RequiresNormalization)
        {
            AssignNormalizedPositions(tasks, now);
            calculation = PositionCalculator.Calculate(
                PositionCalculator.NormalizePositions(tasks.Count),
                tasks.Count);
        }

        var task = new TaskItem
        {
            Id = Guid.NewGuid(),
            Title = request.Title.Trim(),
            Description = request.Description?.Trim() ?? string.Empty,
            Priority = request.Priority!.Value,
            ResponsibleUserId = request.ResponsibleUserId,
            ColumnId = column.Id,
            Position = calculation.Position,
            CreatedAt = now,
            UpdatedAt = now
        };

        dbContext.TaskItems.Add(task);
        await dbContext.SaveChangesAsync(cancellationToken);

        var response = await dbContext.TaskItems
            .AsNoTracking()
            .Include(item => item.ResponsibleUser)
            .SingleAsync(item => item.Id == task.Id, cancellationToken);
        await PublishAsync(projectId, BoardEventTypes.TaskCreated, task.Id, MapTask(response), cancellationToken);
        return Created($"/api/projects/{projectId}/tasks/{task.Id}", MapTask(response));
    }

    [HttpPut("tasks/{taskId:guid}")]
    public async Task<ActionResult<TaskResponse>> UpdateTask(
        Guid projectId,
        Guid taskId,
        [FromBody] UpdateTaskRequest request,
        CancellationToken cancellationToken)
    {
        if (!ValidateTask(request.Title, request.Priority))
        {
            return ValidationProblem(ModelState);
        }

        var task = await dbContext.TaskItems
            .Include(item => item.Column)
            .SingleOrDefaultAsync(item => item.Id == taskId && item.Column.ProjectId == projectId, cancellationToken);
        if (task is null)
        {
            return NotFound();
        }

        if (!await ValidateResponsibleUserAsync(request.ResponsibleUserId, cancellationToken))
        {
            return ValidationProblem(ModelState);
        }

        task.Title = request.Title.Trim();
        task.Description = request.Description?.Trim() ?? string.Empty;
        task.Priority = request.Priority!.Value;
        task.ResponsibleUserId = request.ResponsibleUserId;
        task.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);

        var response = await dbContext.TaskItems
            .AsNoTracking()
            .Include(item => item.ResponsibleUser)
            .SingleAsync(item => item.Id == taskId, cancellationToken);
        var mappedResponse = MapTask(response);
        await PublishAsync(projectId, BoardEventTypes.TaskUpdated, taskId, mappedResponse, cancellationToken);
        return Ok(mappedResponse);
    }

    [HttpDelete("tasks/{taskId:guid}")]
    public async Task<IActionResult> DeleteTask(
        Guid projectId,
        Guid taskId,
        CancellationToken cancellationToken)
    {
        var task = await dbContext.TaskItems
            .Include(item => item.Column)
            .SingleOrDefaultAsync(item => item.Id == taskId && item.Column.ProjectId == projectId, cancellationToken);
        if (task is null)
        {
            return NotFound();
        }

        dbContext.TaskItems.Remove(task);
        await dbContext.SaveChangesAsync(cancellationToken);
        await PublishAsync(projectId, BoardEventTypes.TaskDeleted, taskId, null, cancellationToken);
        return NoContent();
    }

    [HttpPatch("tasks/{taskId:guid}/move")]
    public async Task<ActionResult<BoardResponse>> MoveTask(
        Guid projectId,
        Guid taskId,
        [FromBody] TaskMoveRequest request,
        CancellationToken cancellationToken)
    {
        var task = await dbContext.TaskItems
            .SingleOrDefaultAsync(item => item.Id == taskId && item.Column.ProjectId == projectId, cancellationToken);
        if (task is null)
        {
            return NotFound();
        }

        var targetColumn = await dbContext.BoardColumns
            .SingleOrDefaultAsync(column => column.Id == request.ColumnId && column.ProjectId == projectId, cancellationToken);
        if (targetColumn is null)
        {
            return BadRequest(new { message = "ColumnId must belong to the project." });
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        var sourceColumnId = task.ColumnId;
        var sourceTasks = await dbContext.TaskItems
            .Where(item => item.ColumnId == sourceColumnId)
            .OrderBy(item => item.Position)
            .ThenBy(item => item.Id)
            .ToListAsync(cancellationToken);
        sourceTasks.RemoveAll(item => item.Id == taskId);

        var destinationTasks = sourceColumnId == targetColumn.Id
            ? sourceTasks
            : await dbContext.TaskItems
                .Where(item => item.ColumnId == targetColumn.Id && item.Id != taskId)
                .OrderBy(item => item.Position)
                .ThenBy(item => item.Id)
                .ToListAsync(cancellationToken);

        var targetIndex = Math.Clamp(request.TargetIndex, 0, destinationTasks.Count);
        var destinationPositions = destinationTasks.Select(item => item.Position).ToArray();
        var calculation = PositionCalculator.Calculate(destinationPositions, targetIndex);
        destinationTasks.Insert(targetIndex, task);
        task.ColumnId = targetColumn.Id;
        task.UpdatedAt = DateTime.UtcNow;

        if (calculation.RequiresNormalization)
        {
            AssignNormalizedPositions(destinationTasks, task.UpdatedAt);
        }
        else
        {
            task.Position = calculation.Position;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        var canonicalBoard = await LoadProjectWithBoardAsync(projectId, cancellationToken);
        var response = MapBoard(canonicalBoard!);
        await PublishAsync(projectId, BoardEventTypes.TaskMoved, taskId, response, cancellationToken);
        return Ok(response);
    }

    [HttpPatch("columns/{columnId:guid}/tasks/sort-by-priority")]
    public async Task<ActionResult<IReadOnlyList<TaskResponse>>> SortTasksByPriority(
        Guid projectId,
        Guid columnId,
        CancellationToken cancellationToken)
    {
        var columnExists = await dbContext.BoardColumns
            .AnyAsync(column => column.Id == columnId && column.ProjectId == projectId, cancellationToken);
        if (!columnExists)
        {
            return NotFound();
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        var tasks = await dbContext.TaskItems
            .Where(task => task.ColumnId == columnId)
            .OrderBy(task => task.Position)
            .ThenBy(task => task.Id)
            .ToListAsync(cancellationToken);
        var sortedTasks = BoardOrdering.SortByPriority(tasks);
        var now = DateTime.UtcNow;
        for (var index = 0; index < sortedTasks.Count; index++)
        {
            sortedTasks[index].Position = PositionCalculator.PositionAtIndex(index);
            sortedTasks[index].UpdatedAt = now;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        var response = await dbContext.TaskItems
            .AsNoTracking()
            .Include(task => task.ResponsibleUser)
            .Where(task => task.ColumnId == columnId)
            .OrderBy(task => task.Position)
            .ThenBy(task => task.Id)
            .Select(MapTaskExpression())
            .ToListAsync(cancellationToken);
        await PublishAsync(
            projectId,
            BoardEventTypes.TasksReordered,
            columnId,
            new TasksReorderedEventState(
                columnId,
                response.Select(task => new TaskPositionEventState(task.Id, task.Position)).ToList()),
            cancellationToken);
        return Ok(response);
    }

    private async Task<bool> ProjectExistsAsync(Guid projectId, CancellationToken cancellationToken) =>
        await dbContext.Projects.AsNoTracking().AnyAsync(project => project.Id == projectId, cancellationToken);

    private Task PublishAsync(
        Guid projectId,
        string eventType,
        Guid? resourceId,
        object? state,
        CancellationToken cancellationToken) =>
        boardEventPublisher.PublishAsync(
            new BoardEvent(projectId, resourceId, eventType, DateTime.UtcNow, state),
            cancellationToken);

    private async Task<Project?> LoadProjectWithBoardAsync(Guid projectId, CancellationToken cancellationToken) =>
        await dbContext.Projects
            .AsNoTracking()
            .Include(project => project.Columns)
            .ThenInclude(column => column.Tasks)
            .ThenInclude(task => task.ResponsibleUser)
            .SingleOrDefaultAsync(project => project.Id == projectId, cancellationToken);

    private async Task<bool> ValidateResponsibleUserAsync(Guid? responsibleUserId, CancellationToken cancellationToken)
    {
        if (!responsibleUserId.HasValue)
        {
            return true;
        }

        if (await dbContext.Users.AsNoTracking().AnyAsync(user => user.Id == responsibleUserId.Value, cancellationToken))
        {
            return true;
        }

        ModelState.AddModelError(nameof(CreateTaskRequest.ResponsibleUserId), "ResponsibleUserId must reference an existing user.");
        return false;
    }

    private bool ValidateColumn(ColumnRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            ModelState.AddModelError(nameof(ColumnRequest.Name), "Name is required.");
        }

        return ModelState.IsValid;
    }

    private bool ValidateTask(string title, AgileTaskHub.Domain.Enums.TaskPriority? priority)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            ModelState.AddModelError(nameof(CreateTaskRequest.Title), "Title is required.");
        }

        if (!priority.HasValue || !Enum.IsDefined(priority.Value))
        {
            ModelState.AddModelError(nameof(CreateTaskRequest.Priority), "Priority must be Low, Medium, High or Urgent.");
        }

        return ModelState.IsValid;
    }

    private static void AssignNormalizedPositions(IReadOnlyList<BoardColumn> columns, DateTime updatedAt)
    {
        for (var index = 0; index < columns.Count; index++)
        {
            columns[index].Position = PositionCalculator.PositionAtIndex(index);
        }
    }

    private static void AssignNormalizedPositions(IReadOnlyList<TaskItem> tasks, DateTime updatedAt)
    {
        for (var index = 0; index < tasks.Count; index++)
        {
            tasks[index].Position = PositionCalculator.PositionAtIndex(index);
            tasks[index].UpdatedAt = updatedAt;
        }
    }

    private static ColumnResponse MapColumn(BoardColumn column) => new(
        column.Id,
        column.Name,
        column.Position,
        column.ProjectId,
        column.CreatedAt);

    private static BoardResponse MapBoard(Project project) => new(
        project.Id,
        project.Name,
        project.Description,
        project.StartDate,
        project.ExpectedEndDate,
        project.Status,
        project.CreatedAt,
        project.UpdatedAt,
        project.Columns
            .OrderBy(column => column.Position)
            .ThenBy(column => column.Id)
            .Select(column => new BoardColumnResponse(
                column.Id,
                column.Name,
                column.Position,
                column.ProjectId,
                column.CreatedAt,
                column.Tasks
                    .OrderBy(task => task.Position)
                    .ThenBy(task => task.Id)
                    .Select(MapTask)
                    .ToList()))
            .ToList());

    private static TaskResponse MapTask(TaskItem task) => new(
        task.Id,
        task.Title,
        task.Description,
        task.Priority,
        task.ResponsibleUserId,
        task.ResponsibleUser is null
            ? null
            : new ResponsibleUserResponse(task.ResponsibleUser.Id, task.ResponsibleUser.Name, task.ResponsibleUser.Email),
        task.ColumnId,
        task.Position,
        task.CreatedAt,
        task.UpdatedAt);

    private static System.Linq.Expressions.Expression<Func<TaskItem, TaskResponse>> MapTaskExpression() =>
        task => new TaskResponse(
            task.Id,
            task.Title,
            task.Description,
            task.Priority,
            task.ResponsibleUserId,
            task.ResponsibleUser == null
                ? null
                : new ResponsibleUserResponse(task.ResponsibleUser.Id, task.ResponsibleUser.Name, task.ResponsibleUser.Email),
            task.ColumnId,
            task.Position,
            task.CreatedAt,
            task.UpdatedAt);
}
