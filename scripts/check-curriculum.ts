import { readFileSync, existsSync } from "node:fs";
import { z } from "zod";
const nonempty = z.string().trim().min(1);
const ticket = z.object({
  id: nonempty,
  title: nonempty,
  context: nonempty,
  step: nonempty,
  mode: z.enum(["SOLO", "PAIR"]),
  competencies: z.array(nonempty).min(1).max(2),
  estimate: z.tuple([z.number().positive(), z.number().positive()]),
  acceptance: z.array(nonempty).min(3),
  done: z.array(nonempty).min(3),
  dependencies: z.array(nonempty),
  delivery_status: z.literal("not_started"),
  learning_status: z.literal("unassessed"),
});
const program = z
  .object({
    version: z.literal(2),
    phases: z.array(nonempty).length(3),
    weeklyHours: z.number().positive(),
    milestones: z
      .array(
        z.object({
          id: z.number().int().positive(),
          code: z.string().regex(/^U\d{2}$/),
          title: nonempty,
          phase: nonempty,
          prerequisites: z.array(nonempty),
          competencies: z.array(nonempty).length(2),
          objective: nonempty,
          lesson: z.string().min(200),
          concepts: z.array(nonempty).min(3),
          example: nonempty,
          explanation: nonempty,
          guided: z.array(nonempty).min(3),
          transfer: nonempty,
          remediation: nonempty,
          readiness: nonempty,
          resources: z
            .array(z.object({ title: nonempty, url: z.url() }))
            .min(1),
          targetLevel: z.union([z.literal(3), z.literal(4)]),
          learning_status: z.literal("unassessed"),
          tickets: z.array(ticket).length(4),
        }),
      )
      .min(1),
  })
  .parse(JSON.parse(readFileSync("docs/curriculum/program.json", "utf8")));

const tasks = new Set<string>();
const modules = new Set<string>();
const total = [0, 0],
  soloTotal = [0, 0];
let previousPhase = -1;
for (const m of program.milestones) {
  if (modules.has(m.code) || m.code !== `U${String(m.id).padStart(2, "0")}`)
    throw Error("Invalid module identity");
  for (const p of m.prerequisites)
    if (!modules.has(p)) throw Error(`Missing or forward prerequisite: ${p}`);
  if (modules.size && m.prerequisites.length === 0)
    throw Error("Later module lacks prerequisite evidence");
  const phaseIndex = program.phases.indexOf(m.phase);
  if (phaseIndex < previousPhase || phaseIndex < 0)
    throw Error("Phase order is invalid");
  previousPhase = phaseIndex;
  const guide = `docs/curriculum/${m.code}.md`;
  if (!existsSync(guide)) throw Error(`Missing guide ${guide}`);
  const guideText = readFileSync(guide, "utf8");
  const browserGuide = readFileSync(
    `apps/web/public/guides/${m.code}.md`,
    "utf8",
  );
  if (browserGuide !== guideText) throw Error(`Stale browser guide: ${m.code}`);
  const expectedModes = ["PAIR", "SOLO", "SOLO", "PAIR"];
  for (const [i, t] of m.tickets.entries()) {
    if (
      tasks.has(t.id) ||
      t.id !== `${m.code}-${String(i + 1).padStart(2, "0")}`
    )
      throw Error("Invalid task identity");
    for (const dep of t.dependencies)
      if (!tasks.has(dep))
        throw Error(`Unknown/forward task dependency: ${dep}`);
    if (tasks.size && !t.dependencies.length)
      throw Error("Missing task dependency");
    if (t.mode !== expectedModes[i])
      throw Error("Instruction must precede independent tasks and feedback");
    if (!guideText.includes(t.id) || !guideText.includes(t.context))
      throw Error("Guide is stale; regenerate curriculum");
    if (t.estimate[0] > t.estimate[1]) throw Error("Reversed estimate");
    for (const c of t.competencies)
      if (!m.competencies.includes(c)) throw Error("Undeclared competency");
    tasks.add(t.id);
  }
  for (const index of [0, 1] as const) {
    const hours = m.tickets.reduce((s, t) => s + t.estimate[index], 0);
    const solo = m.tickets
      .filter((t) => t.mode === "SOLO")
      .reduce((s, t) => s + t.estimate[index], 0);
    if (solo / hours < 0.3) throw Error(`${m.code} below independent floor`);
    total[index] = (total[index] ?? 0) + hours;
    soloTotal[index] = (soloTotal[index] ?? 0) + solo;
  }
  for (const c of m.competencies)
    if (!m.tickets.some((t) => t.mode === "SOLO" && t.competencies.includes(c)))
      throw Error(`No independent evidence task: ${c}`);
  modules.add(m.code);
}
if (
  new Set(program.milestones.map((m) => m.phase)).size !== program.phases.length
)
  throw Error("Empty phase");
for (const guide of [
  "START_HERE",
  "FIRST_SESSION",
  "ASSESSMENT",
  "MENTOR",
  "PROJECTS",
  "PORTFOLIO",
  "REVIEW",
]) {
  if (!existsSync(`docs/curriculum/${guide}.md`))
    throw Error(`Missing support guide: ${guide}`);
}
const legacy = JSON.parse(
  readFileSync("docs/curriculum/archive/program-v1.json", "utf8"),
) as { milestones: { tickets: { id: string }[] }[] };
if (legacy.milestones.some((m) => m.tickets.some((t) => tasks.has(t.id))))
  throw Error("New task IDs collide with legacy evidence");
console.log(
  `Validated ${modules.size} modules, ${tasks.size} tasks, prerequisite order, guided-to-independent progression, guide parity and separate legacy IDs. Planned task hours ${total.join("–")}; SOLO ${soloTotal.join("–")}. Learning unassessed.`,
);
