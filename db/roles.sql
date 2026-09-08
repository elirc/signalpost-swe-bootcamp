-- Run using a migration administrator. Local development credentials only.
CREATE ROLE signalpost_ingest LOGIN PASSWORD 'local-ingest-only' NOBYPASSRLS;
CREATE ROLE signalpost_query LOGIN PASSWORD 'local-query-only' NOBYPASSRLS;
CREATE ROLE signalpost_sentinel LOGIN PASSWORD 'local-sentinel-only' NOBYPASSRLS;
GRANT USAGE ON SCHEMA public TO signalpost_ingest, signalpost_query;
GRANT SELECT ON api_keys TO signalpost_ingest, signalpost_query;
GRANT SELECT, INSERT ON ingest_batches TO signalpost_ingest;
GRANT INSERT ON logs, metric_samples, spans TO signalpost_ingest;
GRANT SELECT ON projects, logs, metric_samples, spans, dashboards, saved_queries, schedules, alert_rules, alert_states, alert_evaluations, pages, incidents, incident_events, postmortems, action_items, audit_events TO signalpost_query;
GRANT USAGE ON SCHEMA public TO signalpost_sentinel;
GRANT SELECT ON organizations, alert_rules, metric_samples, schedules TO signalpost_sentinel;
GRANT SELECT, INSERT, UPDATE ON alert_states, pages, notification_outbox TO signalpost_sentinel;
GRANT SELECT, INSERT ON alert_evaluations TO signalpost_sentinel;
