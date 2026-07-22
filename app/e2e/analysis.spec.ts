import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

test("builds and exports a multi-location visibility study", async ({ page }) => {
  const consoleErrors: string[] = [];
  const requestFailures: string[] = [];
  const previewResponses: number[] = [];
  page.on("console", (entry) => {
    if (entry.type() === "error") consoleErrors.push(entry.text());
  });
  page.on("requestfailed", (request) => requestFailures.push(request.url()));
  page.on("response", (response) => {
    if (response.url().endsWith("/api/previews")) previewResponses.push(response.status());
  });
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Compare Visibility across Locations" }),
  ).toBeVisible();

  const theme = page.getByRole("combobox", { name: "Theme" });
  await theme.click();
  await page.getByRole("option", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await theme.click();
  await page.getByRole("option", { name: "Light" }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await theme.click();
  await page.getByRole("option", { name: "System" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "system");

  await page
    .locator('.empty-workspace input[type="file"]')
    .setInputFiles([
      path.resolve("../tests/fixtures/canon_eos_200d/IMG_0085.JPG"),
      path.resolve("../tests/fixtures/canon_eos_200d/IMG_0086.JPG"),
    ]);

  await expect(page.getByRole("heading", { name: "IMG_0085" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open IMG_0086" })).toBeVisible();
  await expect.poll(() => previewResponses, { timeout: 20_000 }).toEqual([200, 200]);

  const firstName = page.getByRole("textbox", { name: "Rename IMG_0085" });
  await firstName.fill("North Approach");
  await firstName.press("Enter");
  await expect(page.getByRole("heading", { name: "North Approach" })).toBeVisible();

  await expect(page.getByRole("button", { name: "Box", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.locator(".selection-toolbar")).toBeVisible();
  await drawTarget(page);
  const localBackground = page.getByRole("button", { name: /^2 Local Background/ });
  const brightBackground = page.getByRole("button", { name: /^3 Bright Background/ });
  await expect(localBackground).toContainText("2.5× their width and height");
  await expect(localBackground).toContainText("Target pixels are excluded when measured");
  await expect(localBackground).toContainText("Box");
  await expect(brightBackground).toContainText("15%-wide by 15%-high box");
  await expect(brightBackground).toContainText("Box");

  await page.getByRole("button", { name: "Open IMG_0086" }).click();
  await expect(page.getByRole("heading", { name: "IMG_0086" })).toBeVisible();
  const secondName = page.getByRole("textbox", { name: "Rename IMG_0086" });
  await secondName.fill("South Platform");
  await secondName.press("Enter");
  await drawTarget(page);
  await page.screenshot({ path: test.info().outputPath("annotation.png"), fullPage: true });

  const analyzeAll = page.getByRole("button", { name: "Analyze All (2)" });
  await expect(analyzeAll).toBeEnabled();
  await analyzeAll.click();

  await expect(page.getByRole("heading", { name: "Location Study" })).toBeVisible();
  const measurementTable = page.getByLabel("Key Measurements");
  const qualityTable = page.getByLabel("Focus and Detail");
  await expect(measurementTable.getByRole("cell", { name: "North Approach" })).toBeVisible();
  await expect(measurementTable.getByRole("cell", { name: "South Platform" })).toBeVisible();
  await expect(page.getByText("2 of 2 scenarios analyzed")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Camera Settings", exact: true })).toBeVisible();
  await expect(
    qualityTable.getByRole("button", { name: "Sort by Target Sharpness", exact: true }),
  ).toBeVisible();
  await expect(qualityTable.getByRole("cell", { name: "North Approach" })).toBeVisible();
  const focalLengthFilter = page.getByRole("combobox", { name: "Focal Length Filter" });
  await focalLengthFilter.click();
  await page.getByRole("option", { name: "48 mm", exact: true }).click();
  await expect(page.getByText("Showing 1 of 2")).toBeVisible();
  await expect(measurementTable.getByRole("cell", { name: "North Approach" })).toBeVisible();
  await expect(measurementTable.getByRole("cell", { name: "South Platform" })).not.toBeVisible();
  await page.getByRole("button", { name: "Reset View" }).click();

  const contrastSort = measurementTable.locator(
    'button[aria-label^="Sort by Robust Contrast-to-Noise Ratio"]',
  );
  await contrastSort.click();
  await contrastSort.click();
  await expect(measurementTable.locator('th[aria-sort="descending"]')).toContainText(
    "Robust Contrast-to-Noise Ratio",
  );
  await expect(measurementTable.locator("tbody tr").first()).toContainText("South Platform");
  expect(await page.locator(".comparison-card h2").allTextContents()).toEqual([
    "South Platform",
    "North Approach",
  ]);
  await page.getByRole("button", { name: "Reset View" }).click();

  await expect(page.getByText("How to Read the Measurements")).toBeVisible();
  await page.getByText("How to Read the Measurements").click();
  await expect(page.getByText("What Is a Stop?")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Focus, Noise, and Artifacts" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "JPEG Blockiness" })).toBeVisible();
  await expect(page.getByText("Is Higher Better?").first()).toBeVisible();
  await expect(page.locator(".difference-count")).toContainText(/\d+ Difference/);
  await expect(page.getByRole("combobox", { name: "Report Metadata" })).toContainText(
    "Safe Metadata",
  );

  await theme.click();
  await page.getByRole("option", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.screenshot({ path: test.info().outputPath("comparison-dark.png"), fullPage: true });
  await theme.click();
  await page.getByRole("option", { name: "System" }).click();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export Report" }).click();
  const download = await downloadPromise;
  const output = test.info().outputPath(download.suggestedFilename());
  await download.saveAs(output);
  const html = await readFile(output, "utf-8");

  expect(download.suggestedFilename()).toBe("scenevis-location-study.html");
  expect(html.match(/data:image\/jpeg;base64,/g)).toHaveLength(2);
  expect(html).toContain("North Approach");
  expect(html).toContain("South Platform");
  expect(html).toContain("Key Measurements");
  expect(html).toContain("What Is a Stop?");
  expect(html).toContain("Focus, Noise, and Artifacts");
  expect(html).toContain("Target Sharpness");
  expect(html).toContain("data-focus-tile");
  expect(html).toContain("Is Higher Better?");
  expect(html).toContain("Camera Settings");
  expect(html).toContain("Filter by Camera Settings");
  expect(html).toContain("Sensitive source fields and original filenames are excluded.");
  expect(html).not.toContain("IMG_0085.JPG");
  expect(html).toContain('data-zone="target"');
  expect(html).not.toContain("<text");
  expect(html).toContain("<script>");

  const reportPage = await page.context().newPage();
  await reportPage.goto(pathToFileURL(output).href);
  await expect(reportPage.getByRole("heading", { name: "Location Study" })).toBeVisible();
  await expect(reportPage.getByRole("heading", { name: "North Approach" })).toBeVisible();
  await expect(reportPage.getByRole("heading", { name: "South Platform" })).toBeVisible();
  await expect(reportPage.getByRole("heading", { name: "What Is a Stop?" })).toBeVisible();
  await expect(reportPage.getByRole("heading", { name: "Focus and Detail" })).toBeVisible();
  await expect(reportPage.getByRole("heading", { name: "JPEG Blockiness" }).first()).toBeVisible();
  const reportFocalLength = reportPage.getByRole("combobox", { name: "Focal Length Filter" });
  await reportFocalLength.selectOption({ label: "48 mm" });
  await expect(reportPage.getByText("Showing 1 of 2")).toBeVisible();
  await expect(reportPage.getByRole("heading", { name: "North Approach" })).toBeVisible();
  await expect(reportPage.getByRole("heading", { name: "South Platform" })).not.toBeVisible();
  await reportPage.getByRole("button", { name: "Reset View" }).click();

  const reportContrastSort = reportPage.getByRole("button", {
    name: "Sort by Robust Contrast-to-Noise Ratio",
  });
  await reportContrastSort.click();
  await reportContrastSort.click();
  await expect(reportPage.locator('th[aria-sort="descending"]')).toContainText(
    "Robust Contrast-to-Noise Ratio",
  );
  await expect(reportPage.locator(".scenario").first()).toContainText("South Platform");
  expect(await reportPage.locator(".scenario").count()).toBe(2);
  expect(await reportPage.locator("svg text").count()).toBe(0);
  await reportPage.screenshot({
    path: test.info().outputPath("comparison-report.png"),
    fullPage: true,
  });
  await reportPage.setViewportSize({ width: 390, height: 844 });
  await expect(reportPage.getByRole("combobox", { name: "Aperture Filter" })).toBeVisible();
  expect(
    await reportPage.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    ),
  ).toBe(false);
  await reportPage.close();

  expect(consoleErrors).toEqual([]);
  expect(requestFailures).toEqual([]);
  await page.screenshot({ path: test.info().outputPath("comparison.png"), fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("combobox", { name: "Aperture Filter" })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    ),
  ).toBe(false);
  await page.screenshot({ path: test.info().outputPath("comparison-narrow.png"), fullPage: true });

  await page.getByRole("tab", { name: "Annotate" }).click();
  await expect(page.locator(".selection-toolbar")).toBeVisible();
  await expect(page.getByRole("button", { name: "Lasso", exact: true })).toBeVisible();
  const focusMap = page.getByRole("button", { name: "Focus Map" });
  await expect(focusMap).toBeEnabled();
  await focusMap.click();
  await expect(focusMap).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".focus-tile").first()).toBeVisible();
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
  await page.screenshot({ path: test.info().outputPath("annotate-narrow.png"), fullPage: true });
});

async function drawTarget(page: import("@playwright/test").Page) {
  const canvas = page.locator(".scene-canvas > svg");
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error("scene canvas has no visible bounds");
  await page.mouse.move(bounds.x + bounds.width * 0.35, bounds.y + bounds.height * 0.35);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width * 0.52, bounds.y + bounds.height * 0.58);
  await page.mouse.up();
}
