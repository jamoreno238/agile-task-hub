using AgileTaskHub.Application.Board;

namespace AgileTaskHub.Application.Tests;

public sealed class BoardRealtimeTests
{
    [Fact]
    public void Uses_a_project_scoped_group_name()
    {
        var projectId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        Assert.Equal("board:11111111-1111-1111-1111-111111111111", BoardGroupNames.ForProject(projectId));
    }
}
