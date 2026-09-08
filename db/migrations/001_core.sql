CREATE TABLE organizations (id uuid PRIMARY KEY, name text NOT NULL CHECK (length(name) BETWEEN 1 AND 120));
CREATE TABLE projects (id uuid PRIMARY KEY, org_id uuid NOT NULL REFERENCES organizations(id), name text NOT NULL, UNIQUE (org_id, id));
CREATE TABLE api_keys (
  id uuid PRIMARY KEY, org_id uuid NOT NULL, project_id uuid NOT NULL,
  token_hash text NOT NULL UNIQUE CHECK (length(token_hash) = 64),
  scope text NOT NULL CHECK (scope IN ('ingest', 'read', 'admin')),
  revoked_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (org_id, project_id) REFERENCES projects(org_id, id)
);
CREATE TABLE ingest_batches (
  org_id uuid NOT NULL REFERENCES organizations(id), key_id uuid NOT NULL REFERENCES api_keys(id),
  request_id text NOT NULL CHECK (length(request_id) <= 128), payload_hash text NOT NULL,
  record_count integer NOT NULL CHECK (record_count >= 0), payload jsonb NOT NULL, committed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (key_id, request_id)
);
CREATE TABLE logs (
  org_id uuid NOT NULL, project_id uuid NOT NULL, event_time timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(), labels jsonb NOT NULL,
  body jsonb, severity text NOT NULL, trace_id text,
  FOREIGN KEY (org_id, project_id) REFERENCES projects(org_id, id)
);
CREATE TABLE metric_samples (
  org_id uuid NOT NULL, project_id uuid NOT NULL, event_time timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(), labels jsonb NOT NULL,
  name text NOT NULL, value double precision NOT NULL CHECK (value NOT IN ('Infinity'::float8, '-Infinity'::float8, 'NaN'::float8)),
  FOREIGN KEY (org_id, project_id) REFERENCES projects(org_id, id)
);
CREATE TABLE spans (
  org_id uuid NOT NULL, project_id uuid NOT NULL, event_time timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(), labels jsonb NOT NULL,
  name text NOT NULL, trace_id text NOT NULL, span_id text NOT NULL, duration_ms double precision NOT NULL CHECK (duration_ms >= 0),
  FOREIGN KEY (org_id, project_id) REFERENCES projects(org_id, id)
);
CREATE INDEX logs_org_time ON logs(org_id, project_id, event_time DESC);
CREATE INDEX logs_labels ON logs USING gin(labels jsonb_path_ops);
CREATE INDEX samples_org_name_time ON metric_samples(org_id, project_id, name, event_time DESC);
CREATE INDEX samples_labels ON metric_samples USING gin(labels jsonb_path_ops);
CREATE INDEX spans_trace ON spans(org_id, trace_id, event_time DESC);
CREATE INDEX spans_labels ON spans USING gin(labels jsonb_path_ops);
CREATE TABLE retention_policies (
  org_id uuid PRIMARY KEY REFERENCES organizations(id), raw_days integer NOT NULL CHECK(raw_days BETWEEN 1 AND 365),
  aggregate_days integer NOT NULL CHECK(aggregate_days >= raw_days AND aggregate_days <= 3650)
);
CREATE TABLE dashboards (id uuid PRIMARY KEY, org_id uuid NOT NULL REFERENCES organizations(id), name text NOT NULL, panels jsonb NOT NULL, version integer NOT NULL DEFAULT 1);
CREATE TABLE saved_queries (id uuid PRIMARY KEY, org_id uuid NOT NULL REFERENCES organizations(id), name text NOT NULL, query jsonb NOT NULL);
CREATE TABLE schedules (
  id uuid PRIMARY KEY, org_id uuid NOT NULL REFERENCES organizations(id), name text NOT NULL,
  timezone text NOT NULL, anchor timestamptz NOT NULL, rotation_seconds integer NOT NULL CHECK(rotation_seconds > 0),
  responders jsonb NOT NULL CHECK(jsonb_typeof(responders) = 'array' AND jsonb_array_length(responders) > 0),
  overrides jsonb NOT NULL DEFAULT '[]', UNIQUE(org_id, id)
);
CREATE TABLE alert_rules (
  id uuid PRIMARY KEY, org_id uuid NOT NULL, project_id uuid NOT NULL,
  name text NOT NULL, metric_name text NOT NULL, threshold double precision NOT NULL,
  for_seconds integer NOT NULL CHECK(for_seconds >= 0), lookback_seconds integer NOT NULL DEFAULT 60 CHECK(lookback_seconds BETWEEN 1 AND 3600),
  enabled boolean NOT NULL DEFAULT true, schedule_id uuid, escalation_seconds integer NOT NULL DEFAULT 300 CHECK(escalation_seconds > 0),
  FOREIGN KEY (org_id, project_id) REFERENCES projects(org_id, id),
  FOREIGN KEY (org_id, schedule_id) REFERENCES schedules(org_id,id), UNIQUE(org_id,id)
);
CREATE TABLE alert_states (
  rule_id uuid PRIMARY KEY REFERENCES alert_rules(id), org_id uuid NOT NULL,
  state text NOT NULL CHECK(state IN ('pending','firing','resolved')), pending_since timestamptz,
  episode_id uuid NOT NULL, last_evaluated_at timestamptz NOT NULL,
  FOREIGN KEY(org_id,rule_id) REFERENCES alert_rules(org_id,id)
);
CREATE TABLE alert_evaluations (
  rule_id uuid NOT NULL REFERENCES alert_rules(id), org_id uuid NOT NULL, evaluated_at timestamptz NOT NULL,
  value double precision, state text NOT NULL, PRIMARY KEY(rule_id,evaluated_at), FOREIGN KEY(org_id,rule_id) REFERENCES alert_rules(org_id,id)
);
CREATE TABLE pages (
  id uuid PRIMARY KEY, org_id uuid NOT NULL, rule_id uuid NOT NULL, episode_id uuid NOT NULL,
  step integer NOT NULL CHECK(step >= 0), responder text NOT NULL,
  state text NOT NULL DEFAULT 'open' CHECK(state IN ('open','acknowledged','resolved')),
  created_at timestamptz NOT NULL DEFAULT now(), acknowledged_at timestamptz, acknowledged_by text,
  FOREIGN KEY(org_id,rule_id) REFERENCES alert_rules(org_id,id), UNIQUE(episode_id,step), UNIQUE(org_id,id)
);
CREATE TABLE notification_outbox (
  id uuid PRIMARY KEY, org_id uuid NOT NULL, page_id uuid NOT NULL, kind text NOT NULL CHECK(kind IN ('firing','resolved')),
  payload jsonb NOT NULL, attempts integer NOT NULL DEFAULT 0,
  available_at timestamptz NOT NULL DEFAULT now(), delivered_at timestamptz, last_error text, dead_at timestamptz,
  FOREIGN KEY(org_id,page_id) REFERENCES pages(org_id,id), UNIQUE(page_id,kind)
);
CREATE INDEX outbox_pending ON notification_outbox(available_at) WHERE delivered_at IS NULL AND dead_at IS NULL;
CREATE TABLE incidents (
  id uuid PRIMARY KEY, org_id uuid NOT NULL REFERENCES organizations(id), title text NOT NULL,
  state text NOT NULL DEFAULT 'investigating' CHECK(state IN ('investigating','identified','monitoring','resolved')),
  public_summary text NOT NULL DEFAULT '', published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(org_id,id)
);
CREATE TABLE incident_events (
  id uuid PRIMARY KEY, org_id uuid NOT NULL, incident_id uuid NOT NULL, actor text NOT NULL,
  body text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY(org_id,incident_id) REFERENCES incidents(org_id,id)
);
CREATE TABLE postmortems (
  id uuid PRIMARY KEY, org_id uuid NOT NULL, incident_id uuid NOT NULL UNIQUE,
  summary text NOT NULL, contributing_factors text NOT NULL, impact text NOT NULL,
  FOREIGN KEY(org_id,incident_id) REFERENCES incidents(org_id,id)
);
CREATE TABLE action_items (
  id uuid PRIMARY KEY, org_id uuid NOT NULL, incident_id uuid NOT NULL, title text NOT NULL, owner text NOT NULL,
  due_at timestamptz NOT NULL, done boolean NOT NULL DEFAULT false,
  FOREIGN KEY(org_id,incident_id) REFERENCES incidents(org_id,id)
);
CREATE TABLE audit_events (
  id uuid PRIMARY KEY, org_id uuid NOT NULL REFERENCES organizations(id), actor text NOT NULL,
  action text NOT NULL, target_id uuid NOT NULL, details jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE FUNCTION deny_audit_mutation() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'append-only history'; END $$;
CREATE TRIGGER audit_append_only BEFORE UPDATE OR DELETE OR TRUNCATE ON audit_events FOR EACH STATEMENT EXECUTE FUNCTION deny_audit_mutation();
CREATE TRIGGER timeline_append_only BEFORE UPDATE OR DELETE OR TRUNCATE ON incident_events FOR EACH STATEMENT EXECUTE FUNCTION deny_audit_mutation();

DO $$ DECLARE tab text; BEGIN
  FOREACH tab IN ARRAY ARRAY['projects','ingest_batches','logs','metric_samples','spans','retention_policies','dashboards','saved_queries','schedules','alert_rules','alert_states','alert_evaluations','pages','notification_outbox','incidents','incident_events','postmortems','action_items','audit_events'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',tab);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY',tab);
    EXECUTE format('CREATE POLICY tenant_boundary ON %I USING (org_id = nullif(current_setting(''app.org_id'',true),'''')::uuid) WITH CHECK (org_id = nullif(current_setting(''app.org_id'',true),'''')::uuid)',tab);
  END LOOP;
END $$;
