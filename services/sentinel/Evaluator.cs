using System.Diagnostics;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;
namespace Signalpost.Sentinel;

public sealed class Evaluator(IDbContextFactory<SentinelDb> factory, IConnectionMultiplexer redis, ILogger<Evaluator> logger) : BackgroundService
{
    public static readonly ActivitySource Traces = new("Signalpost.Sentinel");
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(30));
        do
        {
            try
            {
                await Tick(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception error) { logger.LogError(error, "Evaluation failed; persisted state retained"); }
        } while (await timer.WaitForNextTickAsync(stoppingToken));
    }
    public async Task Tick(CancellationToken ct)
    {
        var token = Guid.NewGuid().ToString("N");
        var lease = redis.GetDatabase();
        if (!await lease.StringSetAsync("signalpost:sentinel:leader", token, TimeSpan.FromSeconds(25), When.NotExists))
            return;
        try
        {
            await using var list = await factory.CreateDbContextAsync(ct);
            var orgs = await list.Organizations.AsNoTracking().Select(o => o.Id).ToListAsync(ct);
            foreach (var org in orgs)
            {
                ct.ThrowIfCancellationRequested();
                if (await lease.StringGetAsync("signalpost:sentinel:leader") != token)
                    break;
                await EvaluateOrganization(org, ct);
            }
        }
        finally { await lease.ScriptEvaluateAsync("if redis.call('GET',KEYS[1]) == ARGV[1] then return redis.call('DEL',KEYS[1]) else return 0 end", [new RedisKey("signalpost:sentinel:leader")], [new RedisValue(token)]); }
    }
    public async Task EvaluateOrganization(Guid org, CancellationToken ct)
    {
        using var activity = Traces.StartActivity("evaluate.organization");
        activity?.SetTag("signalpost.org_id", org);
        await using var db = await factory.CreateDbContextAsync(ct);
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        await db.Database.ExecuteSqlInterpolatedAsync($"SELECT set_config('app.org_id',{org.ToString()},true)", ct);
        // DB transaction lock is the correctness boundary if a Redis lease expires mid-evaluation.
        await db.Database.ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock(hashtextextended({org.ToString()},0))", ct);
        var now = DateTimeOffset.UtcNow;
        var rules = await db.Rules.Where(r => r.OrgId == org && r.Enabled).ToListAsync(ct);
        foreach (var rule in rules)
        {
            var since = now.AddSeconds(-rule.LookbackSeconds);
            var value = await db.Samples.Where(s => s.OrgId == org && s.ProjectId == rule.ProjectId && s.Name == rule.MetricName && s.EventTime >= since && s.EventTime <= now).Select(s => (double?)s.Value).AverageAsync(ct);
            var state = await db.States.SingleOrDefaultAsync(s => s.RuleId == rule.Id, ct);
            var before = state is null ? null : new AlertSnapshot(state.State, state.PendingSince, state.EpisodeId, state.LastEvaluatedAt);
            var next = ThresholdMachine.Evaluate(before, value, rule.Threshold, rule.ForSeconds, now);
            if (state is null)
            {
                state = new AlertState { RuleId = rule.Id, OrgId = org };
                db.States.Add(state);
            }
            state.State = next.State;
            state.PendingSince = next.PendingSince;
            state.EpisodeId = next.EpisodeId;
            state.LastEvaluatedAt = next.LastEvaluatedAt;
            db.Evaluations.Add(new Evaluation { RuleId = rule.Id, OrgId = org, EvaluatedAt = now, Value = value, State = next.State });
            if (next.State == "firing")
            {
                var episodePages = await db.Pages.Where(p => p.EpisodeId == next.EpisodeId).OrderBy(p => p.Step).ToListAsync(ct);
                // v1 provides an initial page and one timeout escalation. Acknowledgement halts escalation.
                var last = episodePages.LastOrDefault();
                if (last is null || (!episodePages.Any(p => p.State == "acknowledged") && last.State == "open" && last.Step == 0 && now >= last.CreatedAt.AddSeconds(rule.EscalationSeconds)))
                {
                    var responder = "local-operator";
                    if (rule.ScheduleId is Guid id)
                    {
                        var schedule = await db.Schedules.SingleAsync(s => s.Id == id && s.OrgId == org, ct);
                        responder = OnCallResolver.Resolve(new OnCallSchedule(schedule.Anchor, schedule.RotationSeconds, schedule.Timezone, JsonSerializer.Deserialize<string[]>(schedule.Responders)!, JsonSerializer.Deserialize<ScheduleOverride[]>(schedule.Overrides, new JsonSerializerOptions { PropertyNameCaseInsensitive = true })!), now);
                    }
                    var page = new Page { Id = Guid.NewGuid(), OrgId = org, RuleId = rule.Id, EpisodeId = next.EpisodeId, Step = last is null ? 0 : 1, Responder = responder, CreatedAt = now };
                    db.Pages.Add(page);
                    await db.SaveChangesAsync(ct);
                    db.Outbox.Add(new Outbox { Id = Guid.NewGuid(), OrgId = org, PageId = page.Id, AvailableAt = now, Payload = JsonSerializer.Serialize(new { pageId = page.Id, rule = rule.Name, responder, step = page.Step, traceparent = Activity.Current?.Id }) });
                }
            }
            if (before?.State == "firing" && next.State == "resolved")
            {
                var pages = await db.Pages.Where(p => p.EpisodeId == next.EpisodeId && p.State != "resolved").ToListAsync(ct);
                foreach (var page in pages)
                {
                    page.State = "resolved";
                    db.Outbox.Add(new Outbox { Id = Guid.NewGuid(), OrgId = org, PageId = page.Id, Kind = "resolved", AvailableAt = now, Payload = JsonSerializer.Serialize(new { pageId = page.Id, rule = rule.Name, resolved = true }) });
                }
            }
        }
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
    }
}
