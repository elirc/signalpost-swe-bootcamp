using Microsoft.EntityFrameworkCore;
namespace Signalpost.Sentinel;

public sealed class Delivery(IDbContextFactory<SentinelDb> factory, IHttpClientFactory clients, IConfiguration config, ILogger<Delivery> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        var endpoint = config["SIGNALPOST_NOTIFICATION_URL"];
        // A real destination must be explicitly configured and reviewed outside drill environments.
        if (endpoint is null)
        {
            logger.LogWarning("Delivery disabled: notification URL unset; outbox remains pending");
            return;
        }
        var uri = new Uri(endpoint);
        if (!uri.IsLoopback)
            throw new InvalidOperationException("This release permits only loopback notification sinks; real delivery requires reviewed egress controls");
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(2));
        do
        {
            try
            {
                await Drain(uri, ct);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested) { break; }
            catch (Exception error) { logger.LogError(error, "Outbox drain failed; retry on next tick"); }
        } while (await timer.WaitForNextTickAsync(ct));
    }
    public async Task Drain(Uri endpoint, CancellationToken ct)
    {
        await using var list = await factory.CreateDbContextAsync(ct);
        var orgs = await list.Organizations.AsNoTracking().Select(x => x.Id).ToListAsync(ct);
        foreach (var org in orgs)
        {
            await using var db = await factory.CreateDbContextAsync(ct);
            await using var transaction = await db.Database.BeginTransactionAsync(ct);
            await db.Database.ExecuteSqlInterpolatedAsync($"SELECT set_config('app.org_id',{org.ToString()},true)", ct);
            var rows = await db.Outbox.FromSqlRaw("SELECT * FROM notification_outbox WHERE delivered_at IS NULL AND dead_at IS NULL AND available_at<=now() ORDER BY available_at LIMIT 10 FOR UPDATE SKIP LOCKED").ToListAsync(ct);
            foreach (var item in rows)
            {
                using var activity = Evaluator.Traces.StartActivity("notification.deliver");
                activity?.SetTag("signalpost.page_id", item.PageId);
                item.Attempts++;
                try
                {
                    using var request = new HttpRequestMessage(HttpMethod.Post, endpoint) { Content = new StringContent(item.Payload, System.Text.Encoding.UTF8, "application/json") };
                    request.Headers.Add("Idempotency-Key", item.Id.ToString());
                    using var response = await clients.CreateClient("notifications").SendAsync(request, ct);
                    response.EnsureSuccessStatusCode();
                    item.DeliveredAt = DateTimeOffset.UtcNow;
                    item.LastError = null;
                }
                catch (Exception error) when (error is HttpRequestException or TaskCanceledException)
                {
                    ct.ThrowIfCancellationRequested();
                    item.LastError = error.GetType().Name;
                    if (item.Attempts >= 8)
                        item.DeadAt = DateTimeOffset.UtcNow;
                    else
                        item.AvailableAt = DateTimeOffset.UtcNow.AddSeconds(Math.Min(300, Math.Pow(2, item.Attempts)) + Random.Shared.NextDouble());
                }
            }
            await db.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
        }
    }
}
