import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";

test("analyzes an image and exports a static report", async ({ page }) => {
  const consoleErrors: string[] = [];
  const requestFailures: string[] = [];
  page.on("console", (entry) => {
    if (entry.type() === "error") consoleErrors.push(entry.text());
  });
  page.on("requestfailed", (request) => requestFailures.push(request.url()));
  await page.goto("/");

  const droppedFile = await page.evaluateHandle(() => {
    const bytes = Uint8Array.from(
      atob(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=",
      ),
      (value) => value.charCodeAt(0),
    );
    const transfer = new DataTransfer();
    transfer.items.add(new File([bytes], "drop.png", { type: "image/png" }));
    return transfer;
  });
  const dropZone = page.getByTestId("file-drop-zone");
  await dropZone.dispatchEvent("dragenter", { dataTransfer: droppedFile });
  await expect(page.getByText("Drop Image Here")).toBeVisible();
  const droppedPreview = page.waitForResponse(
    (response) => response.url().endsWith("/api/previews") && response.status() === 200,
  );
  await dropZone.dispatchEvent("drop", { dataTransfer: droppedFile });
  await droppedPreview;
  await expect(page.getByRole("heading", { name: "drop.png" })).toBeVisible();

  await page
    .locator('input[type="file"]')
    .setInputFiles(path.resolve("../tests/fixtures/canon_eos_200d/IMG_0085.JPG"));

  await expect(page.getByRole("heading", { name: "IMG_0085.JPG" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Box", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  const canvas = page.locator(".scene-canvas svg");
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error("scene canvas has no visible bounds");
  await page.mouse.move(bounds.x + bounds.width * 0.35, bounds.y + bounds.height * 0.35);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width * 0.52, bounds.y + bounds.height * 0.58);
  await page.mouse.up();

  await page.getByRole("button", { name: "Local Background Empty" }).click();
  await page.mouse.move(bounds.x + bounds.width * 0.28, bounds.y + bounds.height * 0.25);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width * 0.6, bounds.y + bounds.height * 0.68);
  await page.mouse.up();

  await page.getByRole("button", { name: "Lasso", exact: true }).click();
  await page.getByRole("button", { name: "Bright Background Empty" }).click();
  await page.mouse.move(bounds.x + bounds.width * 0.72, bounds.y + bounds.height * 0.08);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width * 0.9, bounds.y + bounds.height * 0.09);
  await page.mouse.move(bounds.x + bounds.width * 0.88, bounds.y + bounds.height * 0.28);
  await page.mouse.move(bounds.x + bounds.width * 0.7, bounds.y + bounds.height * 0.25);
  await page.mouse.move(bounds.x + bounds.width * 0.72, bounds.y + bounds.height * 0.08);
  await page.mouse.up();

  const analyze = page.getByRole("button", { name: "Analyze Scene" });
  await expect(analyze).toBeEnabled();
  await analyze.click();

  await expect(page.getByRole("heading", { name: "Robust Contrast-to-Noise Ratio" })).toBeVisible();
  await expect(page.getByText(/How clearly the target separates/)).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export Static HTML" }).click();
  const download = await downloadPromise;
  const output = test.info().outputPath(download.suggestedFilename());
  await download.saveAs(output);
  const html = await readFile(output, "utf-8");

  expect(download.suggestedFilename()).toBe("IMG_0085.scenevis.html");
  expect(html).toContain("data:image/jpeg;base64,");
  expect(html).toContain("Robust Contrast-to-Noise Ratio");
  expect(html).toContain("Target</text>");
  expect(html).not.toContain("<script");
  expect(consoleErrors).toEqual([]);
  expect(requestFailures).toEqual([]);
  await page.screenshot({ path: test.info().outputPath("analysis.png"), fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("button", { name: "Lasso", exact: true })).toBeVisible();
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
  await page.screenshot({ path: test.info().outputPath("analysis-narrow.png"), fullPage: true });
});
