"use client";
import { useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { TelemetryChart } from "./chart";
interface Ticket {
  id: string;
  title: string;
  mode: string;
  competencies: string[];
  estimate: number[];
  context: string;
  acceptance: string[];
  outOfScope: string;
  done: string[];
}
interface Milestone {
  id: number;
  title: string;
  objective: string;
  competencies: string[];
  targetLevel: number;
  lesson: string;
  tickets: Ticket[];
  drill: string;
  transfer: string;
}
interface Program {
  title: string;
  weeklyHours: number;
  milestones: Milestone[];
}
interface Evidence {
  ticket: string;
  prediction: string;
  confidence: string;
  falsifier: string;
  observation: string;
  hours: string;
  bucket: string;
  createdAt: string;
  observationRecordedAt?: string;
}
const views = [
  "Overview",
  "Curriculum",
  "Telemetry lab",
  "Evidence journal",
] as const;
type View = (typeof views)[number];
const demoLogs = Array.from({ length: 2000 }, (_, i) => ({
  time: `12:${String(Math.floor(i / 60) % 60).padStart(2, "0")}:${String(i % 60).padStart(2, "0")}`,
  level: i % 19 === 0 ? "WARN" : "INFO",
  body:
    i % 19 === 0
      ? "Sender received 429; retry scheduled"
      : "Batch committed; acknowledgement sent",
  source: i % 3 === 0 ? "sentinel" : "ingest",
}));
function LogViewer() {
  const parent = useRef<HTMLDivElement>(null);
  const virtual = useVirtualizer({
    count: demoLogs.length,
    getScrollElement: () => parent.current,
    estimateSize: () => 42,
    overscan: 5,
  });
  return (
    <div
      ref={parent}
      className="log-scroll"
      tabIndex={0}
      role="region"
      aria-label="Synthetic log viewer, 2000 rows. Scroll with arrow keys."
    >
      <div style={{ height: virtual.getTotalSize(), position: "relative" }}>
        {virtual.getVirtualItems().map((row) => {
          const log = demoLogs[row.index]!;
          return (
            <div
              className="log-line"
              key={row.key}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: row.size,
                transform: `translateY(${row.start}px)`,
              }}
            >
              <time>{log.time}</time>
              <span className={log.level === "WARN" ? "warn" : "info"}>
                {log.level}
              </span>
              <span>{log.body}</span>
              <small>{log.source}</small>
            </div>
          );
        })}
      </div>
    </div>
  );
}
export function Workspace({ program }: { program: Program }) {
  const [view, setView] = useState<View>("Overview");
  const [selected, setSelected] = useState(0);
  const [activeTicket, setActiveTicket] = useState<string | null>(null);
  const [notes, setNotes] = useState<Evidence[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const [token, setToken] = useState("");
  const [signal, setSignal] = useState("logs");
  const [liveRows, setLiveRows] = useState<unknown[] | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("signalpost-evidence-v1");
      if (raw) {
        const data: unknown = JSON.parse(raw);
        if (Array.isArray(data))
          setNotes(
            data.filter(
              (x): x is Evidence =>
                typeof x === "object" &&
                x !== null &&
                [
                  "ticket",
                  "prediction",
                  "confidence",
                  "falsifier",
                  "observation",
                  "hours",
                  "bucket",
                  "createdAt",
                ].every(
                  (k) => typeof (x as Record<string, unknown>)[k] === "string",
                ),
            ),
          );
      }
    } catch {
      setMessage(
        "Saved journal could not be read. Export a backup after writing new evidence.",
      );
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded)
      try {
        localStorage.setItem("signalpost-evidence-v1", JSON.stringify(notes));
      } catch {
        setMessage(
          "Browser storage unavailable. Export your journal to retain it.",
        );
      }
  }, [notes, loaded]);
  const m = program.milestones[selected]!;
  const ticket = m.tickets.find((t) => t.id === activeTicket);
  function navigate(next: View) {
    setView(next);
    setMessage("");
  }
  function exportNotes() {
    const link = document.createElement("a");
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            { version: 1, learning_status: "unassessed", entries: notes },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
    );
    link.href = url;
    link.download = "signalpost-evidence.json";
    link.click();
    URL.revokeObjectURL(url);
  }
  async function queryLive() {
    setBusy(true);
    setMessage("");
    try {
      const now = new Date();
      const response = await fetch("/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          signal,
          from: new Date(now.getTime() - 86400000).toISOString(),
          to: now.toISOString(),
          limit: 200,
        }),
      });
      const body: unknown = await response.json();
      if (!response.ok)
        throw new Error(
          response.status === 401
            ? "A valid read-scoped token is required."
            : response.status === 503
              ? "The query database is not configured or is unavailable."
              : "The query could not be completed.",
        );
      setLiveRows((body as { rows: unknown[] }).rows);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Query failed");
    } finally {
      setBusy(false);
    }
  }
  function saveEvidence(form: FormData) {
    const entry = {
      ticket: String(form.get("ticket")),
      prediction: String(form.get("prediction")),
      confidence: String(form.get("confidence")),
      falsifier: String(form.get("falsifier")),
      observation: String(form.get("observation") ?? "").trim(),
      hours: String(form.get("hours")),
      bucket: String(form.get("bucket")),
      createdAt: new Date().toISOString(),
    };
    setNotes((old) => [entry, ...old]);
    setMessage(
      "Evidence saved in this browser. Learning remains unassessed until reviewed.",
    );
  }
  return (
    <div className="shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="Signalpost home">
          <span className="brand-mark">
            s<span>•</span>
          </span>
          signalpost<span className="brand-dot">.</span>
        </a>
        <div className="workspace-label">ENGINEERING FIELDWORK</div>
        <nav aria-label="Workspace">
          {views.map((item, i) => (
            <button
              key={item}
              className={view === item ? "nav-item active" : "nav-item"}
              onClick={() => navigate(item)}
              aria-current={view === item ? "page" : undefined}
            >
              <span aria-hidden="true">{["◫", "≡", "⌁", "▤"][i]}</span>
              {item}
              {item === "Curriculum" && <small>13</small>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="status-dot" /> SELF-PACED PROGRAM
          <p>
            Build the system.
            <br />
            Earn the judgment.
          </p>
          <div className="profile">
            <span>E</span>
            <div>
              Engineering workspace<small>Independent study · Pilot</small>
            </div>
          </div>
        </div>
      </aside>
      <div className="body">
        <header className="topbar">
          <div>
            Workspace <span>/</span> <strong>{view}</strong>
          </div>
          <span className="local-badge">
            <span className="status-dot" />
            LOCAL WORKSPACE
          </span>
        </header>
        <main id="main">
          <div className="page-heading">
            <div>
              <div className="eyebrow">THE SIGNALPOST PROGRAM</div>
              <h1>
                {view === "Overview"
                  ? "Engineering, with evidence."
                  : view === "Curriculum"
                    ? "From first commit to on-call."
                    : view === "Telemetry lab"
                      ? "Follow the signal."
                      : "Make your reasoning visible."}
              </h1>
              <p>
                {view === "Overview"
                  ? "A production project. A deliberate practice. A record of what you can do."
                  : view === "Curriculum"
                    ? "Thirteen milestones. Fifty-two tickets. Progress earned through transfer."
                    : view === "Telemetry lab"
                      ? "Explore synthetic telemetry, then query your own local ingestion service."
                      : "Predictions, observations, and honest accounting of your work."}
              </p>
            </div>
            <button className="button secondary compact" onClick={exportNotes}>
              Export evidence <span aria-hidden="true">↗</span>
            </button>
          </div>
          {message && (
            <div className="notice" role="status">
              {message}
            </div>
          )}
          {view === "Overview" && (
            <>
              <section className="hero">
                <div className="hero-copy">
                  <div className="eyebrow light">
                    YOUR NEXT STEP <span>01 / CALIBRATION</span>
                  </div>
                  <h2>
                    Start with what{" "}
                    <br />
                    you can prove.
                  </h2>
                  <p>
                    Trace a request. Diagnose a failure. Write a delegation
                    brief. Establish your baseline before assigning yourself a
                    level.
                  </p>
                  <button
                    className="button"
                    onClick={() => {
                      setSelected(0);
                      navigate("Curriculum");
                    }}
                  >
                    Open calibration <span aria-hidden="true">→</span>
                  </button>
                  <div className="hero-footer">
                    <span>4 tickets</span>
                    <span>12–24 estimated hours</span>
                    <span>50% planned SOLO</span>
                  </div>
                </div>
                <div
                  className="signal-diagram"
                  aria-label="System flow: ingest to durable storage to Sentinel to page"
                >
                  <div className="diagram-caption">THE SYSTEM YOU’LL BUILD</div>
                  <div className="diagram-node">
                    <span>01</span>Ingest <small>OTLP / HTTP</small>
                  </div>
                  <div className="connector" />
                  <div className="diagram-node highlighted">
                    <span>02</span>Durable storage{" "}
                    <small>POSTGRES + TIMESCALE</small>
                  </div>
                  <div className="connector" />
                  <div className="diagram-row">
                    <div className="diagram-node">
                      <span>03</span>Sentinel
                    </div>
                    <span>→</span>
                    <div className="diagram-node">
                      Page <span>↗</span>
                    </div>
                  </div>
                  <div className="diagram-foot">
                    <span className="status-dot" /> No silent drops. No
                    invisible assumptions.
                  </div>
                </div>
              </section>
              <section className="metrics" aria-label="Program status">
                <article>
                  <span>PROGRAM SCOPE</span>
                  <strong>
                    13 <small>milestones</small>
                  </strong>
                  <p>Calibration through handover</p>
                </article>
                <article>
                  <span>LEARNING EVIDENCE</span>
                  <strong>
                    {notes.length} <small>entries</small>
                  </strong>
                  <p>Self-reported · awaiting assessment</p>
                </article>
                <article>
                  <span>PILOT CAPACITY</span>
                  <strong>
                    15 <small>hours / week</small>
                  </strong>
                  <p>Planning assumption · revise with data</p>
                </article>
                <article>
                  <span>COMPETENCE STATUS</span>
                  <strong className="status-text">Unassessed</strong>
                  <p>Working code does not establish skill</p>
                </article>
              </section>
              <div className="two-column">
                <section className="panel">
                  <div className="section-title">
                    <h2>The path ahead</h2>
                    <button
                      className="text-button"
                      onClick={() => navigate("Curriculum")}
                    >
                      View all milestones →
                    </button>
                  </div>
                  {program.milestones.slice(0, 4).map((stage, i) => (
                    <button
                      className="path-row"
                      key={stage.id}
                      onClick={() => {
                        setSelected(i);
                        navigate("Curriculum");
                      }}
                    >
                      <span className={i === 0 ? "step current" : "step"}>
                        {String(stage.id).padStart(2, "0")}
                      </span>
                      <span>
                        <strong>{stage.title}</strong>
                        <small>{stage.competencies.join(" · ")}</small>
                      </span>
                      <span className="pill">
                        {i === 0 ? "START HERE" : "PLANNED"}
                      </span>
                      <span aria-hidden="true">↗</span>
                    </button>
                  ))}
                </section>
                <section className="panel fieldnote">
                  <div className="eyebrow">FIELD NOTE / 001</div>
                  <h2>
                    Delegation is a skill.{" "}
                    <br />
                    Understanding is yours.
                  </h2>
                  <p>
                    Keep two records: whether the software works, and whether
                    you can independently explain, change, and operate it.
                  </p>
                  <div className="rule" />
                  <div className="mini-status">
                    <span>delivery_status</span>
                    <strong>Evidence required</strong>
                  </div>
                  <div className="mini-status">
                    <span>learning_status</span>
                    <strong>Unassessed</strong>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => navigate("Evidence journal")}
                  >
                    Record a prediction →
                  </button>
                </section>
              </div>
              <section className="practice-strip">
                <span className="practice-symbol" aria-hidden="true">
                  ↺
                </span>
                <div>
                  <strong>The weekly practice</strong>
                  <p>
                    A no-AI hour. A planted-defect review. One rotating drill.
                  </p>
                </div>
                <span>
                  70% ticket work <span className="muted">/</span> 30% drills
                </span>
              </section>
            </>
          )}
          {view === "Curriculum" && (
            <div className="curriculum-layout">
              <nav className="milestone-list" aria-label="Milestones">
                {program.milestones.map((stage, i) => (
                  <button
                    key={stage.id}
                    className={selected === i ? "selected" : ""}
                    onClick={() => {
                      setSelected(i);
                      setActiveTicket(null);
                    }}
                    aria-current={selected === i ? "step" : undefined}
                  >
                    <span>{String(stage.id).padStart(2, "0")}</span>
                    <div>
                      {stage.title}
                      <small>{stage.tickets.length} tickets · unassessed</small>
                    </div>
                  </button>
                ))}
              </nav>
              <section className="panel lesson">
                <div className="eyebrow">
                  MILESTONE {String(m.id).padStart(2, "0")}{" "}
                  <span className="pill">
                    TARGET LEVEL {m.targetLevel} · PROVISIONAL
                  </span>
                </div>
                <h2>{m.title}</h2>
                <p className="lead">{m.objective}</p>
                <div className="tags">
                  {m.competencies.map((c) => (
                    <span key={c}>{c}</span>
                  ))}
                </div>
                <h3>Working knowledge</h3>
                <p>{m.lesson}</p>
                <h3>Work the tickets</h3>
                <p className="muted">
                  Write a plan and prediction before implementation. SOLO means
                  no AI. Prepared code earns no SOLO credit.
                </p>
                {m.tickets.map((t) => (
                  <button
                    className={
                      "ticket-row " + (t.id === activeTicket ? "expanded" : "")
                    }
                    onClick={() =>
                      setActiveTicket(t.id === activeTicket ? null : t.id)
                    }
                    key={t.id}
                    aria-expanded={t.id === activeTicket}
                  >
                    <span className={"mode " + t.mode.toLowerCase()}>
                      {t.mode}
                    </span>
                    <span>
                      <small>{t.id}</small>
                      <strong>{t.title}</strong>
                    </span>
                    <span>{t.estimate.join("–")}h</span>
                    <span aria-hidden="true">
                      {t.id === activeTicket ? "−" : "+"}
                    </span>
                  </button>
                ))}
                {ticket && (
                  <article className="ticket-detail">
                    <div className="eyebrow">
                      {ticket.id} / ACCEPTANCE CONTRACT
                    </div>
                    <h3>{ticket.title}</h3>
                    <p>{ticket.context}</p>
                    <ul>
                      {ticket.acceptance.map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                    <h4>Definition of done</h4>
                    <ul>
                      {ticket.done.map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                    <p>
                      <strong>Out of scope:</strong> {ticket.outOfScope}
                    </p>
                    <button
                      className="button secondary"
                      onClick={() => navigate("Evidence journal")}
                    >
                      Write the prediction →
                    </button>
                  </article>
                )}
                <div className="exercise">
                  <div className="eyebrow">TRANSFER EXERCISE</div>
                  <p>{m.transfer}</p>
                  <small>
                    Use a changed example. Record evidence before assigning a
                    rating.
                  </small>
                </div>
                <h3>Adversarial scenario</h3>
                <p>{m.drill}</p>
                <p className="muted">
                  Run planted defects only in disposable worktrees with
                  synthetic data and disabled deployment and notification
                  channels.
                </p>
              </section>
            </div>
          )}
          {view === "Telemetry lab" && (
            <>
              <div className="notice">
                Demonstration data is synthetic. No throughput, SLO, or
                operational readiness is established by this view.
              </div>
              <section className="panel">
                <div className="section-title">
                  <div>
                    <div className="eyebrow">INGEST / SAMPLE VISUALIZATION</div>
                    <h2>A signal through the pipeline</h2>
                  </div>
                  <span className="pill">SYNTHETIC</span>
                </div>
                <TelemetryChart />
              </section>
              <section className="panel spaced">
                <div className="section-title">
                  <h2>Log explorer</h2>
                  <span className="pill">
                    2,000 SYNTHETIC RECORDS · VIRTUALIZED
                  </span>
                </div>
                <LogViewer />
              </section>
              <section className="panel spaced">
                <h2>Query your local service</h2>
                <p className="muted">
                  Last 24 hours, at most 200 records. Your token stays in memory
                  and is sent only to this app’s query endpoint.
                </p>
                <form
                  className="query-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void queryLive();
                  }}
                >
                  <label>
                    Read-scoped token
                    <input
                      type="password"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      required
                      autoComplete="off"
                    />
                  </label>
                  <label>
                    Signal
                    <select
                      value={signal}
                      onChange={(e) => setSignal(e.target.value)}
                    >
                      <option value="logs">Logs</option>
                      <option value="metrics">Metrics</option>
                      <option value="traces">Traces</option>
                    </select>
                  </label>
                  <button className="button secondary" disabled={busy}>
                    {busy ? "Querying…" : "Run query"}
                  </button>
                </form>
                {liveRows && (
                  <div>
                    <p>{liveRows.length} records returned</p>
                    <pre className="query-result">
                      {JSON.stringify(liveRows, null, 2)}
                    </pre>
                  </div>
                )}
              </section>
            </>
          )}
          {view === "Evidence journal" && (
            <div className="two-column journal">
              <section className="panel">
                <div className="eyebrow">BEFORE AND AFTER THE WORK</div>
                <h2>Record an observation</h2>
                <form action={saveEvidence}>
                  <label>
                    Ticket
                    <select
                      name="ticket"
                      defaultValue={activeTicket ?? m.tickets[0]?.id}
                    >
                      {program.milestones
                        .flatMap((stage) => stage.tickets)
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.id} · {t.title}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label>
                    Prediction
                    <textarea
                      name="prediction"
                      required
                      placeholder="State a specific outcome before running the experiment."
                    />
                  </label>
                  <div className="form-row">
                    <label>
                      Confidence (%)
                      <input
                        name="confidence"
                        type="number"
                        min="0"
                        max="100"
                        required
                        defaultValue="50"
                      />
                    </label>
                    <label>
                      Actual hours
                      <input
                        name="hours"
                        type="number"
                        min="0"
                        max="100"
                        step="0.25"
                        required
                        defaultValue="0"
                      />
                    </label>
                  </div>
                  <label>
                    Falsifying observation
                    <textarea
                      name="falsifier"
                      required
                      placeholder="Record the result that would prove this prediction wrong."
                    />
                  </label>
                  <label>
                    Observed result / evidence
                    <textarea
                      name="observation"
                      placeholder="Leave blank to save the prediction before the experiment. Append the observed result afterward."
                    />
                  </label>
                  <label>
                    Time bucket
                    <select name="bucket">
                      <option>Implementing</option>
                      <option>Investigating</option>
                      <option>Reviewing</option>
                      <option>Record-keeping</option>
                    </select>
                  </label>
                  <button className="button secondary" disabled={!loaded}>
                    Save evidence
                  </button>
                </form>
              </section>
              <section>
                <div className="panel fieldnote">
                  <div className="eyebrow">EVIDENCE ≠ ASSESSMENT</div>
                  <h2>
                    Keep the claim smaller{" "}
                    <br />
                    than the evidence.
                  </h2>
                  <p>
                    Entries are self-reported and stored in this browser. Export
                    them for review and backup. They do not automatically change
                    skill ratings or complete a milestone.
                  </p>
                </div>
                <div className="entry-list">
                  {notes.length === 0 ? (
                    <div className="empty">
                      <span aria-hidden="true">▤</span>
                      <h3>Your first observation belongs here.</h3>
                      <p>Begin with a falsifiable prediction.</p>
                    </div>
                  ) : (
                    notes.map((note, i) => (
                      <article
                        className="panel entry"
                        key={`${note.createdAt}-${i}`}
                      >
                        <div className="eyebrow">
                          {note.ticket} · {note.confidence}% CONFIDENCE
                        </div>
                        <h3>{note.prediction}</h3>
                        <p>
                          <strong>Falsifier:</strong> {note.falsifier}
                        </p>
                        {note.observation ? <p>{note.observation}</p> : <form action={(form) => {
                          const observation = String(form.get("result") ?? "").trim();
                          if (!observation) return;
                          setNotes(old => old.map(item => item === note ? {...item, observation, observationRecordedAt: new Date().toISOString()} : item));
                          setMessage("Observation appended. The original prediction is preserved.");
                        }}>
                          <label>Append observed result<textarea name="result" required placeholder="Record actual output and evidence; preserve the original prediction." /></label>
                          <button className="button secondary">Append result</button>
                        </form>}
                        <small>
                          {note.hours}h · {note.bucket} ·{" "}
                          {new Date(note.createdAt).toLocaleDateString()}
                        </small>
                      </article>
                    ))
                  )}
                </div>
              </section>
            </div>
          )}
          <footer>
            <span>
              signalpost <span className="muted">/</span> engineering fieldwork
            </span>
            <span>
              Evidence before confidence.{" "}
              <span className="footer-square">■</span>
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
