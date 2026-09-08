"use client";
import { useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { TelemetryChart } from "./chart";
interface Ticket {
  id: string;
  title: string;
  mode: string;
  step: string;
  competencies: string[];
  estimate: number[];
  context: string;
  acceptance: string[];
  outOfScope: string;
  done: string[];
}
interface Milestone {
  id: number;
  code: string;
  phase: string;
  prerequisites: string[];
  concepts: string[];
  example: string;
  explanation: string;
  guided: string[];
  remediation: string;
  readiness: string;
  resources: { title: string; url: string }[];
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
  version: number;
  weeklyHours: number;
  phases: string[];
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
  assistance?: string;
  artifact?: string;
  explanation?: string;
}
const views = [
  "Overview",
  "Curriculum",
  "Advanced reference",
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
  const first = program.milestones[0]!;
  const firstHours = [0, 1].map((index) =>
    first.tickets.reduce((total, t) => total + (t.estimate[index] ?? 0), 0),
  );
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
            {
              version: 2,
              curriculum_version: program.version,
              learning_status: "unassessed",
              entries: notes,
            },
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
      assistance: String(form.get("assistance") ?? "Not recorded"),
      artifact: String(form.get("artifact") ?? "").trim(),
      explanation: String(form.get("explanation") ?? "").trim(),
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
        <div className="workspace-label">YOUR ENGINEERING PRACTICE</div>
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
              {item === "Curriculum" && (
                <small>{program.milestones.length}</small>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="status-dot" /> SELF-PACED PROGRAM
          <p>
            Practice the skill.
            <br />
            Develop your judgment.
          </p>
          <div className="profile">
            <span>E</span>
            <div>
              Your learning workspace<small>Beginner-safe · Self-paced</small>
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
                  ? "Grow as an engineer."
                  : view === "Curriculum"
                    ? "Learn it. Build it. Explain it."
                    : view === "Advanced reference"
                      ? "Explore an advanced example."
                      : "Make your reasoning visible."}
              </h1>
              <p>
                {view === "Overview"
                  ? "Start with fundamentals. Build independent skill. Grow into wider responsibility."
                  : view === "Curriculum"
                    ? `${program.milestones.length} modules, ${program.milestones.reduce((sum, stage) => sum + stage.tickets.length, 0)} practice tasks. Instruction before independent work.`
                    : view === "Advanced reference"
                      ? "Optional material for later study. Begin here after the foundations."
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
                    YOUR FIRST SESSION <span>75 MINUTES · U01</span>
                  </div>
                  <h2>
                    Small programs. <br />
                    Real understanding.
                  </h2>
                  <p>
                    Run a file, trace a function, then change it yourself. Start
                    with guidance and build toward independent work.
                  </p>
                  <button
                    className="button"
                    onClick={() => {
                      setSelected(0);
                      setActiveTicket(first.tickets[0]!.id);
                      navigate("Curriculum");
                    }}
                  >
                    Start learning <span aria-hidden="true">→</span>
                  </button>
                  <div className="hero-footer">
                    <span>No prior code assumed</span>
                    <span>No cloud setup</span>
                    <span>One skill at a time</span>
                  </div>
                </div>
                <div
                  className="signal-diagram"
                  aria-label="Learning loop: learn, practice, explain, revisit"
                >
                  <div className="diagram-caption">HOW YOU WILL DEVELOP</div>
                  <div className="diagram-node">
                    <span>01</span>Learn <small>A WORKED EXAMPLE</small>
                  </div>
                  <div className="connector" />
                  <div className="diagram-node highlighted">
                    <span>02</span>Practice <small>YOUR OWN CODE</small>
                  </div>
                  <div className="connector" />
                  <div className="diagram-row">
                    <div className="diagram-node">
                      <span>03</span>Explain
                    </div>
                    <span>→</span>
                    <div className="diagram-node">
                      Revisit <span>↻</span>
                    </div>
                  </div>
                  <div className="diagram-foot">
                    <span className="status-dot" /> A changed problem shows what
                    transfers.
                  </div>
                </div>
              </section>
              <section className="metrics" aria-label="Program status">
                <article>
                  <span>YOUR PATH</span>
                  <strong>
                    {program.milestones.length} <small>modules</small>
                  </strong>
                  <p>Foundations to senior responsibilities</p>
                </article>
                <article>
                  <span>PRACTICE RECORD</span>
                  <strong>
                    {notes.length} <small>entries</small>
                  </strong>
                  <p>Self-reported · not a skill score</p>
                </article>
                <article>
                  <span>PILOT CAPACITY</span>
                  <strong>
                    {program.weeklyHours} <small>hours / week</small>
                  </strong>
                  <p>Provisional · reduce to fit your week</p>
                </article>
                <article>
                  <span>PERSONAL BASELINE</span>
                  <strong className="status-text">Unassessed</strong>
                  <p>Challenge out with independent evidence</p>
                </article>
              </section>
              <div className="two-column">
                <section className="panel">
                  <div className="section-title">
                    <h2>Three stages of growth</h2>
                    <button
                      className="text-button"
                      onClick={() => navigate("Curriculum")}
                    >
                      All modules →
                    </button>
                  </div>
                  {program.phases.map((phase, i) => {
                    const firstIndex = program.milestones.findIndex(
                      (stage) => stage.phase === phase,
                    );
                    const members = program.milestones.filter(
                      (stage) => stage.phase === phase,
                    );
                    return (
                      <button
                        className="path-row"
                        key={phase}
                        onClick={() => {
                          setSelected(firstIndex);
                          setActiveTicket(null);
                          navigate("Curriculum");
                        }}
                      >
                        <span className={i === 0 ? "step current" : "step"}>
                          {i + 1}
                        </span>
                        <span>
                          <strong>{phase}</strong>
                          <small>
                            {members[0]?.code}–{members.at(-1)?.code} ·{" "}
                            {
                              [
                                "Write, debug and build a usable app",
                                "Deliver, maintain and verify features",
                                "Design, operate and enable others",
                              ][i]
                            }
                          </small>
                        </span>
                        <span aria-hidden="true">↗</span>
                      </button>
                    );
                  })}
                </section>
                <section className="panel fieldnote">
                  <div className="eyebrow">YOUR STARTING POINT</div>
                  <h2>
                    Support first. <br />
                    Independence through practice.
                  </h2>
                  <p>
                    U01 takes about {firstHours.join("–")} focused hours across
                    several sessions. Already comfortable? Demonstrate the
                    independent task and a changed example to skip familiar
                    material.
                  </p>
                  <div className="rule" />
                  <p>
                    A completed course does not confer a job title. Mid-level
                    and senior readiness need evidence of ownership, judgment
                    and work with other people.
                  </p>
                </section>
              </div>
              <section className="panel spaced">
                <div className="eyebrow">TODAY · ONE SMALL OUTCOME</div>
                <h2>Run, predict, explain</h2>
                <p>
                  <a
                    className="text-button"
                    href="/guides/FIRST_SESSION.md"
                    download
                  >
                    Save the full 75-minute guide →
                  </a>
                </p>
                <ol className="guided-list">
                  <li>
                    Open the repository in your editor. Run{" "}
                    <code>node --version</code> in its terminal.
                  </li>
                  <li>
                    Follow the U01 worked example. Predict its output before
                    running it, then change one boundary.
                  </li>
                  <li>
                    Open <code>practice/learner/u01.mjs</code>. Its unfinished
                    functions are your first practice.
                  </li>
                  <li>
                    Run <code>node --test practice/checks/u01.test.mjs</code>.
                    Initial failures are expected; read one before editing.
                  </li>
                  <li>
                    Keep a three-line note: intention, actual result, help used.
                    Return to a changed example after a few days.
                  </li>
                </ol>
                <p className="muted">
                  The complete 75-minute guide is in{" "}
                  <code>docs/curriculum/FIRST_SESSION.md</code>. No database or
                  backend setup is needed.
                </p>
              </section>
              <section className="practice-strip">
                <span className="practice-symbol" aria-hidden="true">
                  ↻
                </span>
                <div>
                  <strong>When you get stuck</strong>
                  <p>
                    Reduce the input. Inspect a value. Take one concept hint.
                    Retry a changed example.
                  </p>
                </div>
                <span>Practice + feedback + delayed recall</span>
              </section>
            </>
          )}
          {view === "Curriculum" && (
            <div className="curriculum-layout">
              <nav className="milestone-list" aria-label="Learning modules">
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
                    <span>{stage.code}</span>
                    <div>
                      {stage.title}
                      <small>{stage.phase} · unassessed</small>
                    </div>
                  </button>
                ))}
              </nav>
              <section className="panel lesson">
                <div className="eyebrow">
                  {m.code} · {m.phase}{" "}
                  <span className="pill">
                    {m.targetLevel === 3
                      ? "INDEPENDENT TASK"
                      : "UNFAMILIAR VARIATION"}
                  </span>
                </div>
                <h2>{m.title}</h2>
                <p className="lead">{m.objective}</p>
                <div className="tags">
                  {m.competencies.map((c) => (
                    <span key={c}>{c}</span>
                  ))}
                </div>
                <p className="muted">
                  Prerequisites:{" "}
                  {m.prerequisites.length
                    ? m.prerequisites.join(", ")
                    : "None. Begin with the guided example."}{" "}
                  Use evidence to challenge out of familiar material.
                </p>
                <p>
                  <a href={`/guides/${m.code}.md`} download>
                    Save this module guide
                  </a>
                  {" · "}
                  <a href="/guides/ASSESSMENT.md" download>
                    Assessment guide
                  </a>
                  {" · "}
                  <a href="/guides/PROJECTS.md" download>
                    Project setup
                  </a>
                </p>
                <h3>Understand the idea</h3>
                <p>{m.lesson}</p>
                <ul className="guided-list">
                  {m.concepts.map((concept) => (
                    <li key={concept}>{concept}</li>
                  ))}
                </ul>
                <h3>A worked example</h3>
                <pre className="worked-code">
                  <code>{m.example}</code>
                </pre>
                <p>{m.explanation}</p>
                <h3>Try it with guidance</h3>
                <ol className="guided-list">
                  {m.guided.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
                <h3>Your practice sequence</h3>
                <p className="muted">
                  Learn with guidance, build independently, then transfer and
                  review. PAIR means you type with guidance; SOLO means no AI
                  during the attempt. Ordinary documentation is allowed.
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
                      {ticket.id} / {ticket.step}
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
                  <div className="eyebrow">DELAYED TRANSFER</div>
                  <p>{m.transfer}</p>
                  <small>
                    Revisit after 2–7 days with the old solution closed, then
                    again around three weeks. These are scheduling defaults, not
                    mastery guarantees.
                  </small>
                </div>
                <h3>If this is too difficult</h3>
                <p>{m.remediation}</p>
                <h3>Evidence to move forward</h3>
                <p>{m.readiness}</p>
                <h3>Targeted reading</h3>
                <ul>
                  {m.resources.map((resource) => (
                    <li key={resource.url}>
                      <a href={resource.url} target="_blank" rel="noreferrer">
                        {resource.title}
                      </a>
                    </li>
                  ))}
                </ul>
                <h3>One debugging scenario</h3>
                <p>{m.drill}</p>
                <p className="muted">
                  Run planted defects only in disposable worktrees with
                  synthetic data and disabled deployment and notification
                  channels.
                </p>
              </section>
            </div>
          )}
          {view === "Advanced reference" && (
            <>
              <div className="notice">
                Optional U09–U11 reference. Demonstration data is synthetic. No
                throughput, SLO, or operational readiness is established by this
                view.
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
                      placeholder="What do you expect, and why? Save before running if possible."
                    />
                  </label>
                  <label>
                    Observed result / evidence
                    <textarea
                      name="observation"
                      placeholder="Actual output and what you learned. Leave blank to append it after the attempt."
                    />
                  </label>
                  <label>
                    Help used
                    <select name="assistance" defaultValue="Not yet recorded">
                      <option>Not yet recorded</option>
                      <option>No AI; ordinary documentation only</option>
                      <option>Concept hint</option>
                      <option>Guided example or explanation</option>
                      <option>Agent-written code</option>
                    </select>
                  </label>
                  <details className="journal-details">
                    <summary>Optional assessment details</summary>
                    <p className="muted">
                      A short intention, result and help record is enough for a
                      small exercise. Add detail when it helps review.
                    </p>
                    <label>
                      Artifact / command
                      <input
                        name="artifact"
                        placeholder="Your file, commit, command or evidence location"
                      />
                    </label>
                    <label>
                      Explain-back / next gap
                      <textarea
                        name="explanation"
                        placeholder="Inputs, decisions, limits and the next gap."
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
                          placeholder="Optional"
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
                          defaultValue="0"
                        />
                      </label>
                    </div>
                    <label>
                      Falsifying observation
                      <textarea
                        name="falsifier"
                        placeholder="What result would show your prediction was wrong?"
                      />
                    </label>
                    <label>
                      Time bucket
                      <select name="bucket">
                        <option>Learning / guided practice</option>
                        <option>Independent practice</option>
                        <option>Implementing</option>
                        <option>Investigating</option>
                        <option>Reviewing</option>
                        <option>Record-keeping</option>
                      </select>
                    </label>
                  </details>
                  <button className="button secondary" disabled={!loaded}>
                    Save evidence
                  </button>
                </form>
              </section>
              <section>
                <div className="panel fieldnote">
                  <div className="eyebrow">EVIDENCE ≠ ASSESSMENT</div>
                  <h2>
                    Keep the claim smaller <br />
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
                          {note.ticket}
                          {note.confidence
                            ? ` · ${note.confidence}% CONFIDENCE`
                            : ""}
                          {note.ticket.startsWith("M") && (
                            <span> · Legacy advanced program</span>
                          )}
                        </div>
                        <h3>{note.prediction}</h3>
                        {note.assistance && (
                          <p>
                            <strong>Help:</strong> {note.assistance}
                          </p>
                        )}
                        {note.artifact && (
                          <p>
                            <strong>Artifact:</strong> {note.artifact}
                          </p>
                        )}
                        {note.explanation && (
                          <p>
                            <strong>Explain-back:</strong> {note.explanation}
                          </p>
                        )}
                        <p>
                          <strong>Falsifier:</strong> {note.falsifier}
                        </p>
                        {note.observation ? (
                          <p>{note.observation}</p>
                        ) : (
                          <form
                            action={(form) => {
                              const observation = String(
                                form.get("result") ?? "",
                              ).trim();
                              if (!observation) return;
                              setNotes((old) =>
                                old.map((item) =>
                                  item === note
                                    ? {
                                        ...item,
                                        observation,
                                        hours: String(
                                          form.get("actualHours") ?? item.hours,
                                        ),
                                        assistance: String(
                                          form.get("actualHelp") ??
                                            item.assistance ??
                                            "Not recorded",
                                        ),
                                        artifact: String(
                                          form.get("actualArtifact") ??
                                            item.artifact ??
                                            "",
                                        ),
                                        observationRecordedAt:
                                          new Date().toISOString(),
                                      }
                                    : item,
                                ),
                              );
                              setMessage(
                                "Observation appended. The original prediction is preserved.",
                              );
                            }}
                          >
                            <label>
                              Append observed result
                              <textarea
                                name="result"
                                required
                                placeholder="Record actual output and evidence; preserve the original prediction."
                              />
                            </label>
                            <label>
                              Hours after the attempt
                              <input
                                name="actualHours"
                                type="number"
                                min="0"
                                max="100"
                                step="0.25"
                                defaultValue={note.hours}
                                required
                              />
                            </label>
                            <label>
                              Actual help used
                              <select
                                name="actualHelp"
                                defaultValue={note.assistance ?? "Not recorded"}
                              >
                                <option>Not recorded</option>
                                <option>Not yet recorded</option>
                                <option>
                                  No AI; ordinary documentation only
                                </option>
                                <option>Concept hint</option>
                                <option>Guided example or explanation</option>
                                <option>Agent-written code</option>
                              </select>
                            </label>
                            <label>
                              Result artifact
                              <input
                                name="actualArtifact"
                                defaultValue={note.artifact ?? ""}
                                placeholder="File, commit or command"
                              />
                            </label>
                            <button className="button secondary">
                              Append result
                            </button>
                          </form>
                        )}
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
              signalpost <span className="muted">/</span> personal engineering
              practice
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
