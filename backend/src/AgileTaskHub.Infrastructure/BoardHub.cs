using AgileTaskHub.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace AgileTaskHub.Infrastructure.Realtime;

[Authorize]
public sealed class BoardHub(AppDbContext dbContext) : Hub
{
    public async Task JoinBoard(Guid projectId)
    {
        if (!await dbContext.Projects.AsNoTracking().AnyAsync(project => project.Id == projectId, Context.ConnectionAborted))
        {
            throw new HubException("Project not found.");
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(projectId), Context.ConnectionAborted);
    }

    public Task LeaveBoard(Guid projectId) =>
        Groups.RemoveFromGroupAsync(Context.ConnectionId, GroupName(projectId), Context.ConnectionAborted);

    public static string GroupName(Guid projectId) => $"board:{projectId}";
}
