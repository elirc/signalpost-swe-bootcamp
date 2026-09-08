CREATE EXTENSION IF NOT EXISTS timescaledb;
SELECT create_hypertable('logs', 'event_time', if_not_exists => true, migrate_data => true);
SELECT create_hypertable('metric_samples', 'event_time', if_not_exists => true, migrate_data => true);
SELECT create_hypertable('spans', 'event_time', if_not_exists => true, migrate_data => true);
-- Timescale continuous aggregates cannot read an RLS source. Keep queryable raw
-- data behind RLS and use an inaccessible transactional mirror for aggregation.
CREATE SCHEMA analytics;
REVOKE ALL ON SCHEMA analytics FROM PUBLIC;
CREATE TABLE analytics.metric_source (LIKE public.metric_samples INCLUDING DEFAULTS INCLUDING CONSTRAINTS);
SELECT create_hypertable('analytics.metric_source','event_time',if_not_exists=>true);
INSERT INTO analytics.metric_source SELECT * FROM public.metric_samples;
CREATE FUNCTION analytics.mirror_sample() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
BEGIN INSERT INTO analytics.metric_source VALUES (NEW.*); RETURN NEW; END $$;
REVOKE ALL ON FUNCTION analytics.mirror_sample() FROM PUBLIC;
CREATE TRIGGER mirror_durable_sample AFTER INSERT ON public.metric_samples FOR EACH ROW EXECUTE FUNCTION analytics.mirror_sample();
CREATE MATERIALIZED VIEW analytics.metric_hourly WITH (timescaledb.continuous) AS
  SELECT org_id, project_id, name, labels, time_bucket(INTERVAL '1 hour', event_time) AS bucket,
    sum(value) AS total, count(*) AS count, min(value) AS minimum, max(value) AS maximum
  FROM analytics.metric_source GROUP BY org_id, project_id, name, labels, bucket WITH NO DATA;
-- No automatic raw retention policy. A reviewed job must establish a safe watermark first.
