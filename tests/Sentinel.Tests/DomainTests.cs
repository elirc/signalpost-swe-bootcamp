using Signalpost.Sentinel;
using Xunit;
namespace Signalpost.Tests;

public class DomainTests
{
    private readonly DateTimeOffset anchor = DateTimeOffset.Parse("2026-03-08T08:00:00Z");
    [Fact]
    public void FlappingRestartsPendingTimer()
    {
        AlertSnapshot? state = null;
        foreach (var seconds in new[] { 0, 30, 60 })
            state = ThresholdMachine.Evaluate(state, 11, 10, 120, anchor.AddSeconds(seconds));
        Assert.Equal("pending", state!.State);
        state = ThresholdMachine.Evaluate(state, 9, 10, 120, anchor.AddSeconds(90));
        Assert.Equal("resolved", state.State);
        foreach (var seconds in new[] { 120, 150, 180, 210 })
            state = ThresholdMachine.Evaluate(state, 11, 10, 120, anchor.AddSeconds(seconds));
        Assert.Equal("pending", state.State);
        state = ThresholdMachine.Evaluate(state, 11, 10, 120, anchor.AddSeconds(240));
        Assert.Equal("firing", state.State);
    }
    [Fact]
    public void GapCannotPretendToBeSustainedEvidence()
    {
        var state = ThresholdMachine.Evaluate(null, 11, 10, 120, anchor);
        state = ThresholdMachine.Evaluate(state, 11, 10, 120, anchor.AddMinutes(12));
        Assert.Equal("pending", state.State);
        Assert.Equal(anchor.AddMinutes(12), state.PendingSince);
    }
    [Fact]
    public void NoDataDoesNotResolveFiring()
    {
        var state = ThresholdMachine.Evaluate(null, 11, 10, 0, anchor);
        var next = ThresholdMachine.Evaluate(state, null, 10, 0, anchor.AddSeconds(30));
        Assert.Equal("firing", next.State);
        Assert.Equal(state.EpisodeId, next.EpisodeId);
    }
    [Fact]
    public void RepeatedEvaluationKeepsEpisode()
    {
        var state = ThresholdMachine.Evaluate(null, 11, 10, 0, anchor);
        Assert.Equal(state, ThresholdMachine.Evaluate(state, 9, 10, 0, anchor));
        Assert.Equal(state.EpisodeId, ThresholdMachine.Evaluate(state, 11, 10, 0, anchor.AddSeconds(30)).EpisodeId);
    }
    [Fact]
    public void ReopenedAlertHasNewEpisode()
    {
        var state = ThresholdMachine.Evaluate(null, 11, 10, 0, anchor);
        var resolved = ThresholdMachine.Evaluate(state, 9, 10, 0, anchor.AddSeconds(30));
        var reopened = ThresholdMachine.Evaluate(resolved, 11, 10, 0, anchor.AddSeconds(60));
        Assert.NotEqual(state.EpisodeId, reopened.EpisodeId);
    }
    [Theory]
    [InlineData("America/Los_Angeles")]
    [InlineData("Europe/Berlin")]
    [InlineData("Asia/Kathmandu")]
    [InlineData("Australia/Lord_Howe")]
    public void ResolutionIsOffsetIndependentAcrossDst(string zone)
    {
        var schedule = new OnCallSchedule(anchor, 86400, zone, ["a", "b", "c"], []);
        var random = new Random(42);
        for (var i = 0; i < 10000; i++)
        {
            var instant = anchor.AddSeconds(random.Next(-20000000, 20000000));
            Assert.Equal(OnCallResolver.Resolve(schedule, instant), OnCallResolver.Resolve(schedule, instant.ToOffset(TimeSpan.FromHours(5.5))));
            Assert.Contains(OnCallResolver.Resolve(schedule, instant), schedule.Responders);
        }
    }
    [Fact]
    public void HalfOpenOverrideAndNegativeSlot()
    {
        var schedule = new OnCallSchedule(anchor, 3600, "UTC", ["a", "b"], [new(Guid.Empty, anchor, anchor.AddHours(1), 10, "c")]);
        Assert.Equal("b", OnCallResolver.Resolve(schedule, anchor.AddTicks(-1)));
        Assert.Equal("c", OnCallResolver.Resolve(schedule, anchor));
        Assert.Equal("b", OnCallResolver.Resolve(schedule, anchor.AddHours(1)));
    }
    [Fact]
    public void EqualPriorityUsesStableId()
    {
        var one = new ScheduleOverride(Guid.Empty, anchor, anchor.AddHours(2), 1, "a");
        var two = new ScheduleOverride(Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff"), anchor, anchor.AddHours(2), 1, "b");
        var schedule = new OnCallSchedule(anchor, 3600, "UTC", ["c"], [two, one]);
        Assert.Equal("a", OnCallResolver.Resolve(schedule, anchor));
        Assert.Equal("a", OnCallResolver.Resolve(schedule with
        {
            Overrides = [one, two]
        }, anchor));
    }
    [Fact]
    public void EmptyRosterIsRejected()
    {
        Assert.Throws<ArgumentException>(() => OnCallResolver.Resolve(new(anchor, 3600, "UTC", [], []), anchor));
    }
    [Fact]
    public void DistantHandoffPreservesSingleTickBoundary()
    {
        var schedule = new OnCallSchedule(DateTimeOffset.MinValue, 3600, "UTC", ["a", "b"], []);
        var handoff = DateTimeOffset.Parse("9999-12-31T23:00:00Z");
        Assert.NotEqual(OnCallResolver.Resolve(schedule, handoff), OnCallResolver.Resolve(schedule, handoff.AddTicks(-1)));
    }
    [Fact]
    public void DuplicateOverrideIdentitiesAreRejected()
    {
        var first = new ScheduleOverride(Guid.Empty, anchor, anchor.AddHours(1), 1, "a");
        var schedule = new OnCallSchedule(anchor, 3600, "UTC", ["a"], [first, first with { Responder = "b" }]);
        Assert.Throws<ArgumentException>(() => OnCallResolver.Resolve(schedule, anchor));
    }
}
