import { readFileSync } from "node:fs";
import { z } from "zod";
const ticket = z.object({
  id: z.string(),
  mode: z.enum(["SOLO", "PAIR", "DELEGATE", "SPIKE"]),
  competencies: z.array(z.string()).min(1).max(2),
  estimate: z.tuple([z.number().positive(), z.number().positive()]),
  acceptance: z.array(z.string()).min(1),
  done: z.array(z.string()).min(1),
  learning_status: z.literal("unassessed"),
});
const program = z
  .object({
    milestones: z
      .array(
        z.object({
          id: z.number(),
          competencies: z.array(z.string()),
          tickets: z.array(ticket).min(1),
        }),
      )
      .length(13),
  })
  .parse(JSON.parse(readFileSync("docs/curriculum/program.json", "utf8")));
const ids = new Set<string>();
for (const milestone of program.milestones) {
  for (const index of [0, 1] as const) {
    const total = milestone.tickets.reduce((s, t) => s + t.estimate[index], 0);
    const solo = milestone.tickets
      .filter((t) => t.mode === "SOLO")
      .reduce((s, t) => s + t.estimate[index], 0);
    if (solo / total < 0.3)
      throw new Error(`M${milestone.id} below SOLO floor`);
  }
  for (const t of milestone.tickets) {
    if (ids.has(t.id)) throw new Error("Duplicate ticket");
    ids.add(t.id);
    if (t.estimate[0] > t.estimate[1]) throw new Error("Invalid estimate");
  }
  for (const c of milestone.competencies)
    if (
      !milestone.tickets.some(
        (t) => t.mode === "SOLO" && t.competencies.includes(c),
      )
    )
      throw new Error(`No SOLO target for ${c}`);
}
console.log(
  `Validated ${program.milestones.length} milestones, ${ids.size} tickets, SOLO allocations and unassessed learning statuses.`,
);
