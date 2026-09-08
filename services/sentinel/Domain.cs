namespace Signalpost.Sentinel;

public sealed record AlertSnapshot(string State, DateTimeOffset? PendingSince, Guid EpisodeId, DateTimeOffset LastEvaluatedAt);
public static class ThresholdMachine
{
    // Null data is not evidence of recovery. Existing firing episodes remain firing.
    // A gap in pending observations restarts the timer; no outage backfill is inferred.
    public static AlertSnapshot Evaluate(AlertSnapshot? previous, double? value, double threshold, int forSeconds, DateTimeOffset now, int cadenceSeconds = 30)
    {
        if (!double.IsFinite(threshold) || forSeconds < 0 || cadenceSeconds <= 0 || (value.HasValue && !double.IsFinite(value.Value)))
            throw new ArgumentException("Invalid rule or observation");
        if (previous is not null && now <= previous.LastEvaluatedAt)
            return previous;
        var episode = previous?.EpisodeId ?? Guid.NewGuid();
        if (!value.HasValue)
            return new(previous?.State == "firing" ? "firing" : "resolved", null, episode, now);
        if (value <= threshold)
            return new("resolved", null, episode, now);
        if (previous?.State == "firing")
            return new("firing", previous.PendingSince, episode, now);
        var continuous = previous?.State == "pending" && (now - previous.LastEvaluatedAt).TotalSeconds <= cadenceSeconds * 2;
        var since = continuous ? previous!.PendingSince ?? now : now;
        if (previous?.State != "pending")
            episode = Guid.NewGuid();
        return new((now - since).TotalSeconds >= forSeconds ? "firing" : "pending", since, episode, now);
    }
}

public sealed record ScheduleOverride(Guid Id, DateTimeOffset Start, DateTimeOffset End, int Priority, string Responder);
public sealed record OnCallSchedule(DateTimeOffset Anchor, int RotationSeconds, string Timezone, IReadOnlyList<string> Responders, IReadOnlyList<ScheduleOverride> Overrides);
public static class OnCallResolver
{
    // Rotations are elapsed UTC durations. The named zone is for rendering, not local-server arithmetic.
    public static string Resolve(OnCallSchedule schedule, DateTimeOffset instant)
    {
        _ = TimeZoneInfo.FindSystemTimeZoneById(schedule.Timezone);
        if (schedule.RotationSeconds <= 0 || schedule.Responders.Count == 0 || schedule.Responders.Any(string.IsNullOrWhiteSpace))
            throw new ArgumentException("Nonempty responders and positive duration required");
        if (schedule.Overrides.Any(o => o.End <= o.Start || string.IsNullOrWhiteSpace(o.Responder)))
            throw new ArgumentException("Invalid override");
        if (schedule.Overrides.Select(o => o.Id).Distinct().Count() != schedule.Overrides.Count)
            throw new ArgumentException("Override identities must be unique");
        var active = schedule.Overrides.Where(o => o.Start <= instant && instant < o.End).OrderByDescending(o => o.Priority).ThenBy(o => o.Id.ToString("D"), StringComparer.Ordinal).FirstOrDefault();
        if (active is not null)
            return active.Responder;
        var elapsedTicks = instant.UtcTicks - schedule.Anchor.UtcTicks;
        var rotationTicks = (long)schedule.RotationSeconds * TimeSpan.TicksPerSecond;
        var slot = elapsedTicks / rotationTicks;
        if (elapsedTicks < 0 && elapsedTicks % rotationTicks != 0)
            slot--; // Integer division truncates; rotations need floor for pre-anchor instants.
        var index = (int)((slot % schedule.Responders.Count + schedule.Responders.Count) % schedule.Responders.Count);
        return schedule.Responders[index];
    }
}
