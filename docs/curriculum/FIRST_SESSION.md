# Your first 75 minutes

Goal: explain and change a small JavaScript function yourself. No prior programming assumed. Today is U01-01, guided practice; do not label copied examples independent work. Stop at 75 minutes and continue next session if needed.

## 0–10 minutes: find and run a file

Open this folder in your editor: `C:\Users\E\Desktop\astralaearning`. Open a PowerShell terminal there. The terminal executes commands; your editor changes files. A working directory is the folder relative paths start from.

```powershell
Get-Location
node --version
git status --short
```

This prepared machine has Node 24. A version beginning `v24.` or later is sufficient for the JavaScript exercises. No install, account, Docker or cloud service is needed. If `node` is not recognized, resolve that setup issue before studying syntax; record the exact error, never guess that the program ran. Windows uses `npm.cmd` in later commands to avoid PowerShell script-policy issues.

Create `practice/learner/hello.mjs` in the editor and type:

```javascript
console.log("I ran this file");
```

Run `node practice/learner/hello.mjs`. Expected output: `I ran this file`. Save the file before rerunning. If the terminal cannot find it, compare your working directory and filename, including the extension. `.mjs` is a JavaScript module file.

## 10–25 minutes: understand a function

Replace the scratch file contents by typing:

```javascript
function addMinutes(first, second) {
  return first + second;
}
const result = addMinutes(10, 15);
console.log(result);
```

`function` defines an operation. `first` and `second` are parameters; 10 and 15 are argument values. `return` gives the caller an answer. `const result` names that answer. The expected output is 25.

Before running, predict the result for `(0, 15)` and `(10, 0)`. Then try `("10", 15)`: the quoted value is a string, so the result is the text `1015`. Record what changed and why. Do not add broad validation yet; this exercise teaches the difference between value types.

Remove `return` temporarily and inspect the result. `undefined` means no value was returned. Restore it. Printing inside a function and returning to a caller serve different purposes.

## 25–45 minutes: trace a collection

Type the temperature example in [U01](U01.md). An array holds several values. `for...of` visits each value. `let` permits the counter to change. `if` runs its body only when a condition is true. `>=` includes the boundary.

Make this trace before execution:

| Input reading | Count before | Is reading >=20? | Count after |
| --- | --- | --- | --- |
| 19 | 0 | false | 0 |
| 20 | 0 | true | 1 |
| 24 | 1 | true | 2 |

Explain why `[]` returns 0. Change the threshold into a second parameter. Predict results for the same readings with thresholds 20 and 24, then run and compare. If this is confusing, stay here and use the hint ladder below.

## 45–65 minutes: inspect your first exercise

Open `practice/learner/u01.mjs`. Its functions are intentionally unfinished. Objects such as `{title: "Read", done: false}` group named values; `task.title` reads one property. An assertion is an executable expectation, such as checking a function returned a particular array.

Run:

```powershell
node --test practice/checks/u01.test.mjs
```

The initial run must fail with `U01 learner implementation required`. That is the starting point, not a broken install. Read the [U01-02 contract](U01.md) before editing. Start with an empty-input case; then one task; then two. In guided practice a tutor may explain an idea, but you type and explain the implementation. Complete independent U01-02 in a later session with AI completions/chat disabled and no worked solution open.

Do not edit the supplied checks to make your implementation pass. Add your own examples in a separate file. Expected outputs in the tests describe the contract; they are not an implementation. Passing them does not replace explain-back or transfer.

## 65–75 minutes: explain and stop

Close the code. Explain what input your function receives, how it chooses or combines values, and what it returns. Reopen it and compare. Run `git diff -- practice/learner` to inspect your actual edits. A commit is optional today; learning basic branching comes through repeated practice, not a command memorization exam.

Write just three lines in `practice/learner/notes.md` or the portal journal:

1. I expected ___ because ___.
2. I observed ___ using command ___; my artifact is ___.
3. Help used: ___; next gap: ___.

Keep the original prediction if it was wrong. Next session: finish U01 guided practice, then attempt the task summary independently. Reconstruct a changed version 2–7 days later. No promotion or skill rating is awarded for reading this lesson.

## Hint ladder

After roughly 10 minutes stuck, write the smallest failing input and actual output. Inspect the relevant value or trace it. After another 10 minutes, ask the tutor for a concept hint, then a smaller example in a different domain if needed. If the tutor explains the solution, count that attempt as guided; rebuild a changed task independently later. More confusion is a reason to shrink the exercise, not to spend hours guessing.
