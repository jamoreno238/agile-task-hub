namespace AgileTaskHub.Application.Board;

public static class BoardRules
{
    public static bool ColumnHasTasks(int taskCount) => taskCount > 0;
}
