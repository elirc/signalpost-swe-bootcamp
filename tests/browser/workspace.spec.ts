import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("curriculum, evidence persistence and export", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Grow as an engineer." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Start learning" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Programming you can explain",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: /Implement the task summary/,
    })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Implement the task summary",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Write the prediction" }).click();
  await page.getByText("Optional assessment details", { exact: true }).click();
  await page
    .getByLabel("Prediction", { exact: true })
    .fill("Only unfinished task titles are returned");
  await page
    .getByLabel("Falsifying observation")
    .fill("A completed task title appears in the result");
  await page.getByRole("button", { name: "Save evidence" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Learning remains unassessed",
  );
  const original = await page.evaluate(
    () => JSON.parse(localStorage.getItem("signalpost-evidence-v1") ?? "[]")[0],
  );
  await page
    .getByLabel("Append observed result")
    .fill("Synthetic browser verification result");
  await page.getByLabel("Hours after the attempt").fill("1.25");
  await page
    .getByRole("combobox", { name: "Actual help used", exact: true })
    .selectOption("Concept hint");
  await page.getByLabel("Result artifact").fill("practice/learner/u01.mjs");
  await page.getByRole("button", { name: "Append result" }).click();
  await expect(page.getByRole("status")).toContainText(
    "original prediction is preserved",
  );
  const appended = await page.evaluate(
    () => JSON.parse(localStorage.getItem("signalpost-evidence-v1") ?? "[]")[0],
  );
  expect(appended.prediction).toBe(original.prediction);
  expect(appended.createdAt).toBe(original.createdAt);
  expect(appended.observationRecordedAt).toBeTruthy();
  expect(appended.ticket).toBe("U01-02");
  expect(appended.hours).toBe("1.25");
  expect(appended.assistance).toBe("Concept hint");
  expect(appended.artifact).toBe("practice/learner/u01.mjs");
  await page.reload();
  await page
    .getByRole("button", { name: "Evidence journal", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Only unfinished task titles are returned",
    }),
  ).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export evidence" }).click();
  expect((await download).suggestedFilename()).toBe("signalpost-evidence.json");
});
test("synthetic data is labeled and logs are virtualized", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Advanced reference", exact: true })
    .click();
  await expect(
    page.getByText("Demonstration data is synthetic.", { exact: false }),
  ).toBeVisible();
  expect(await page.locator(".log-line").count()).toBeLessThan(40);
  await expect(page.locator("figcaption")).toContainText(
    "not a measured benchmark",
  );
});
test("overview and curriculum satisfy automated accessibility checks", async ({
  page,
}) => {
  await page.goto("/");
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.getByRole("button", { name: "Start learning" }).click();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
});
test("mobile layout has no horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Start learning" }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("query is unavailable rather than synthetic success without configuration", async ({
  request,
}) => {
  const response = await request.post("/api/query", {
    data: { signal: "logs" },
  });
  expect([401, 503]).toContain(response.status());
});

test("first-session and module guides are available without backend setup", async ({
  request,
}) => {
  const first = await request.get("/guides/FIRST_SESSION.md");
  expect(first.status()).toBe(200);
  expect(await first.text()).toContain(
    "node --test practice/checks/u01.test.mjs",
  );
  const module = await request.get("/guides/U12.md");
  expect(module.status()).toBe(200);
  expect(await module.text()).toContain("Transfer to room booking");
});

test("new path keeps legacy evidence attributable and does not award competence", async ({
  page,
}) => {
  const legacy = {
    ticket: "M00-01",
    prediction: "Historical prediction",
    confidence: "60",
    falsifier: "Historical falsifier",
    observation: "Historical result",
    hours: "1",
    bucket: "Investigating",
    createdAt: "2026-09-01T10:00:00.000Z",
  };
  await page.addInitScript(
    (entry) =>
      localStorage.setItem("signalpost-evidence-v1", JSON.stringify([entry])),
    legacy,
  );
  await page.goto("/");
  await expect(page.getByText("Unassessed", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Start learning" }).click();
  await expect(
    page.getByRole("heading", { name: "A worked example" }),
  ).toBeVisible();
  await expect(page.locator(".worked-code")).toContainText("countWarm");
  await expect(
    page.getByRole("heading", { name: "If this is too difficult" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Evidence journal", exact: true })
    .click();
  await expect(
    page.getByText("Legacy advanced program", { exact: false }),
  ).toBeVisible();
  const retained = await page.evaluate(
    () => JSON.parse(localStorage.getItem("signalpost-evidence-v1") ?? "[]")[0],
  );
  expect(retained).toEqual(legacy);
});
