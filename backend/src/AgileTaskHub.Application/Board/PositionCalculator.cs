namespace AgileTaskHub.Application.Board;

public sealed record PositionCalculation(long Position, bool RequiresNormalization);

public static class PositionCalculator
{
    public const long DefaultInterval = 1024;

    public static PositionCalculation Calculate(IReadOnlyList<long> orderedPositions, int insertionIndex)
    {
        if (orderedPositions.Count == 0)
        {
            return new PositionCalculation(DefaultInterval, false);
        }

        var index = Math.Clamp(insertionIndex, 0, orderedPositions.Count);
        if (index == 0)
        {
            var firstPosition = orderedPositions[0];
            var candidate = firstPosition / 2;
            return candidate > 0
                ? new PositionCalculation(candidate, false)
                : NormalizedCalculation(orderedPositions.Count, index);
        }

        if (index == orderedPositions.Count)
        {
            var lastPosition = orderedPositions[^1];
            if (lastPosition <= long.MaxValue - DefaultInterval)
            {
                return new PositionCalculation(lastPosition + DefaultInterval, false);
            }

            return NormalizedCalculation(orderedPositions.Count, index);
        }

        var previousPosition = orderedPositions[index - 1];
        var nextPosition = orderedPositions[index];
        var gap = nextPosition - previousPosition;
        if (gap > 1)
        {
            return new PositionCalculation(previousPosition + (gap / 2), false);
        }

        return NormalizedCalculation(orderedPositions.Count, index);
    }

    public static long CalculatePosition(IReadOnlyList<long> orderedPositions, int insertionIndex) =>
        Calculate(orderedPositions, insertionIndex).Position;

    public static IReadOnlyList<long> NormalizePositions(int itemCount)
    {
        if (itemCount < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(itemCount));
        }

        return Enumerable.Range(1, itemCount)
            .Select(index => checked(index * DefaultInterval))
            .ToArray();
    }

    public static long PositionAtIndex(int zeroBasedIndex) =>
        checked((zeroBasedIndex + 1L) * DefaultInterval);

    private static PositionCalculation NormalizedCalculation(int itemCount, int insertionIndex) =>
        new(PositionAtIndex(insertionIndex), true);
}
