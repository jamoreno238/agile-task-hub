using AgileTaskHub.Application.Board;
using Microsoft.AspNetCore.SignalR;

namespace AgileTaskHub.Infrastructure.Realtime;

public sealed class SignalRBoardEventPublisher(IHubContext<BoardHub> hubContext) : IBoardEventPublisher
{
    public Task PublishAsync(BoardEvent boardEvent, CancellationToken cancellationToken = default) =>
        hubContext.Clients
            // Events originate from HTTP requests, so SignalR has no caller connection id
            // available here. Group delivery keeps the event scoped to this project;
            // frontend handlers are idempotent for the initiating tab as well.
            .Group(BoardGroupNames.ForProject(boardEvent.ProjectId))
            .SendAsync(boardEvent.EventType, boardEvent, cancellationToken);
}
