// Disposable in-memory SQL practice; no connection strings or external effects.
import { PGlite } from "@electric-sql/pglite";
import { createInterface } from "node:readline";
import { stdin, stdout } from "node:process";

const db = new PGlite();
await db.waitReady;
console.log(
  "SQL practice: in memory, discarded on exit. End statements with ;. Exit: .exit",
);
const input = createInterface({
  input: stdin,
  output: stdout,
  terminal: Boolean(stdin.isTTY),
});
let pending = "";
input.setPrompt("sql> ");
input.prompt();
try {
  for await (const line of input) {
    if (line.trim() === ".exit") break;
    pending += line + "\n";
    if (line.trim().endsWith(";")) {
      try {
        for (const result of await db.exec(pending))
          console.log(JSON.stringify(result.rows, null, 2));
      } catch (error) {
        console.error(error instanceof Error ? error.message : String(error));
      }
      pending = "";
    }
    input.setPrompt(pending ? " ... " : "sql> ");
    input.prompt();
  }
} finally {
  input.close();
  await db.close();
}
