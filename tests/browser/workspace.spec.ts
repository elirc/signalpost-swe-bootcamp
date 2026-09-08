import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("curriculum, evidence persistence and export", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Engineering, with evidence." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open calibration" }).click();
  await expect(
    page.getByRole("heading", { name: "Calibration", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: /Trace a request through an unfamiliar service/,
    })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Trace a request through an unfamiliar service without AI",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Write the prediction" }).click();
  await page
    .getByLabel("Prediction", { exact: true })
    .fill("A rejected batch creates zero durable rows");
  await page
    .getByLabel("Falsifying observation")
    .fill("Any rejected batch ID appears in storage");
  await page.getByRole("button", { name: "Save evidence" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Learning remains unassessed",
  );
  const original = await page.evaluate(() => JSON.parse(localStorage.getItem("signalpost-evidence-v1") ?? "[]")[0]);
  await page.getByLabel("Append observed result").fill("Synthetic browser verification result");
  await page.getByRole("button", { name: "Append result" }).click();
  await expect(page.getByRole("status")).toContainText("original prediction is preserved");
  const appended = await page.evaluate(() => JSON.parse(localStorage.getItem("signalpost-evidence-v1") ?? "[]")[0]);
  expect(appended.prediction).toBe(original.prediction);
  expect(appended.createdAt).toBe(original.createdAt);
  expect(appended.observationRecordedAt).toBeTruthy();
  await page.reload();
  await page
    .getByRole("button", { name: "Evidence journal", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "A rejected batch creates zero durable rows",
    }),
  ).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export evidence" }).click();
  expect((await download).suggestedFilename()).toBe("signalpost-evidence.json");
});
test("synthetic data is labeled and logs are virtualized", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Telemetry lab", exact: true })
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
  await page.getByRole("button", { name: "Open calibration" }).click();
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
  await page.getByRole("button", { name: "Open calibration" }).click();
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
