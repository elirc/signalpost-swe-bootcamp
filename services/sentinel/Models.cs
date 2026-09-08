using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;
namespace Signalpost.Sentinel;

public sealed class Organization
{
    public Guid Id
    {
        get; set;
    }
    public string Name { get; set; } = "";
}
public sealed class Rule
{
    public Guid Id
    {
        get; set;
    }
    public Guid OrgId
    {
        get; set;
    }
    public Guid ProjectId
    {
        get; set;
    }
    public string Name { get; set; } = ""; public string MetricName { get; set; } = ""; public double Threshold
    {
        get; set;
    }
    public int ForSeconds
    {
        get; set;
    }
    public int LookbackSeconds
    {
        get; set;
    }
    public bool Enabled
    {
        get; set;
    }
    public Guid? ScheduleId
    {
        get; set;
    }
    public int EscalationSeconds
    {
        get; set;
    }
}
public sealed class AlertState
{
    public Guid RuleId
    {
        get; set;
    }
    public Guid OrgId
    {
        get; set;
    }
    public string State { get; set; } = "resolved"; public DateTimeOffset? PendingSince
    {
        get; set;
    }
    public Guid EpisodeId
    {
        get; set;
    }
    public DateTimeOffset LastEvaluatedAt
    {
        get; set;
    }
}
public sealed class Evaluation
{
    public Guid RuleId
    {
        get; set;
    }
    public Guid OrgId
    {
        get; set;
    }
    public DateTimeOffset EvaluatedAt
    {
        get; set;
    }
    public double? Value
    {
        get; set;
    }
    public string State { get; set; } = "";
}
public sealed class Page
{
    public Guid Id
    {
        get; set;
    }
    public Guid OrgId
    {
        get; set;
    }
    public Guid RuleId
    {
        get; set;
    }
    public Guid EpisodeId
    {
        get; set;
    }
    public int Step
    {
        get; set;
    }
    public string Responder { get; set; } = ""; public string State { get; set; } = "open"; public DateTimeOffset CreatedAt
    {
        get; set;
    }
    public DateTimeOffset? AcknowledgedAt
    {
        get; set;
    }
    public string? AcknowledgedBy
    {
        get; set;
    }
}
public sealed class Outbox
{
    public Guid Id
    {
        get; set;
    }
    public Guid OrgId
    {
        get; set;
    }
    public Guid PageId
    {
        get; set;
    }
    public string Kind { get; set; } = "firing"; public string Payload { get; set; } = "{}"; public int Attempts
    {
        get; set;
    }
    public DateTimeOffset AvailableAt
    {
        get; set;
    }
    public DateTimeOffset? DeliveredAt
    {
        get; set;
    }
    public string? LastError
    {
        get; set;
    }
    public DateTimeOffset? DeadAt
    {
        get; set;
    }
}
public sealed class Schedule
{
    public Guid Id
    {
        get; set;
    }
    public Guid OrgId
    {
        get; set;
    }
    public string Name { get; set; } = ""; public DateTimeOffset Anchor
    {
        get; set;
    }
    public int RotationSeconds
    {
        get; set;
    }
    public string Timezone { get; set; } = "UTC"; public string Responders { get; set; } = "[]"; public string Overrides { get; set; } = "[]";
}
public sealed class MetricSample
{
    public Guid OrgId
    {
        get; set;
    }
    public Guid ProjectId
    {
        get; set;
    }
    public DateTimeOffset EventTime
    {
        get; set;
    }
    public string Name { get; set; } = ""; public double Value
    {
        get; set;
    }
}
public sealed class SentinelDb(DbContextOptions<SentinelDb> options) : DbContext(options)
{
    public DbSet<Organization> Organizations => Set<Organization>(); public DbSet<Rule> Rules => Set<Rule>(); public DbSet<AlertState> States => Set<AlertState>(); public DbSet<Page> Pages => Set<Page>(); public DbSet<Outbox> Outbox => Set<Outbox>(); public DbSet<Schedule> Schedules => Set<Schedule>(); public DbSet<MetricSample> Samples => Set<MetricSample>(); public DbSet<Evaluation> Evaluations => Set<Evaluation>();
    protected override void OnModelCreating(ModelBuilder model)
    {
        model.Entity<Organization>().ToTable("organizations");
        model.Entity<Rule>().ToTable("alert_rules");
        model.Entity<AlertState>().ToTable("alert_states").HasKey(x => x.RuleId);
        model.Entity<Page>().ToTable("pages");
        model.Entity<Page>().HasIndex(x => new { x.EpisodeId, x.Step }).IsUnique();
        model.Entity<Outbox>().ToTable("notification_outbox");
        model.Entity<Outbox>().Property(x => x.Payload).HasColumnType("jsonb");
        model.Entity<Schedule>().ToTable("schedules");
        model.Entity<Schedule>().Property(x => x.Responders).HasColumnType("jsonb");
        model.Entity<Schedule>().Property(x => x.Overrides).HasColumnType("jsonb");
        model.Entity<MetricSample>().ToTable("metric_samples").HasNoKey();
        model.Entity<Evaluation>().ToTable("alert_evaluations").HasKey(x => new { x.RuleId, x.EvaluatedAt });
        foreach (var entity in model.Model.GetEntityTypes())
        foreach (var property in entity.GetProperties())
            property.SetColumnName(Regex.Replace(property.Name, "([a-z0-9])([A-Z])", "$1_$2").ToLowerInvariant());
    }
}
