# Learner workspace

Start with [FIRST_SESSION](../docs/curriculum/FIRST_SESSION.md). Work in `learner/`; supplied contracts are in `checks/`. The first three starters are intentionally unfinished or defective. They are excluded from the product test suite so product CI cannot accidentally certify learner completion.

```powershell
node --test practice/checks/u01.test.mjs
node --test practice/checks/u02.test.mjs
node --import tsx --test practice/checks/u03.test.ts
node node_modules/typescript/bin/tsc -p practice/tsconfig.json
```

Do only the current module. Failing starter checks are expected. Add your own tests and explain results; never change contract expectations just to obtain green output. The U02 defect is isolated here, uses synthetic data and has no deployment, database credentials or notification path.

`node practice/sql-console.mjs` starts the U05 in-memory SQL sandbox. Exit with `.exit`; contents disappear. For the later project, follow [PROJECTS](../docs/curriculum/PROJECTS.md).

No answers are shipped beside the independent exercises. Worked examples in the guides use different problems. Learner files are real source you can commit; temporary databases and dependencies are ignored. Do not regenerate or overwrite your learner work to restart a session.
