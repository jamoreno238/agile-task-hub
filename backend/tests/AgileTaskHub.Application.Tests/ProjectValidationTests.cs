using AgileTaskHub.Application.Projects;

namespace AgileTaskHub.Application.Tests;

public sealed class ProjectValidationTests
{
    [Fact]
    public void GetDateRangeError_rejects_end_before_start()
    {
        var error = ProjectValidation.GetDateRangeError(
            new DateTime(2026, 8, 10),
            new DateTime(2026, 8, 9));

        Assert.NotNull(error);
    }

    [Fact]
    public void GetDateRangeError_accepts_same_day_and_later_end()
    {
        Assert.Null(ProjectValidation.GetDateRangeError(
            new DateTime(2026, 8, 10),
            new DateTime(2026, 8, 10)));
        Assert.Null(ProjectValidation.GetDateRangeError(
            new DateTime(2026, 8, 10),
            new DateTime(2026, 8, 11)));
    }
}
