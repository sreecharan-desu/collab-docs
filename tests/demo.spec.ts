import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const screenshotsDir = path.join(process.cwd(), "docs/screenshots");
const demoDir = path.join(process.cwd(), "docs/demo");

test.beforeAll(() => {
  fs.mkdirSync(screenshotsDir, { recursive: true });
  fs.mkdirSync(demoDir, { recursive: true });
});

test("collab docs walkthrough", async ({ page, context }) => {
  test.slow();

  await page.goto("/login");
  await page.getByLabel("Email").fill("alice@demo.com");
  await page.getByLabel("Password").fill("demo1234");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Your workspace" })).toBeVisible();

  await page.screenshot({ path: path.join(screenshotsDir, "01-dashboard-alice.png"), fullPage: true });

  await page.getByRole("button", { name: "New document" }).click();
  await page.waitForURL(/\/documents\//);

  const editor = page.locator(".ProseMirror");
  await editor.click();
  await page.keyboard.type("Product sync notes");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Discuss launch timeline and owners.");
  await page.waitForTimeout(1500);
  await expect(page.getByText("Saved")).toBeVisible();

  await page.reload();
  await expect(editor).toContainText("Product sync notes");
  await expect(editor).toContainText("Discuss launch timeline and owners.");

  await editor.click();
  await page.keyboard.press("Control+a");
  await page.getByRole("button", { name: "Heading 1" }).click();
  await page.screenshot({ path: path.join(screenshotsDir, "02-editor-formatted.png"), fullPage: true });

  await page.goto("/");
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(path.join(process.cwd(), "tests/fixtures/sample-upload.md"));
  await page.waitForURL(/\/documents\//);
  await expect(editor).toContainText("Sample upload");

  await page.screenshot({ path: path.join(screenshotsDir, "03-upload-import.png"), fullPage: true });

  await page.getByRole("button", { name: "Share" }).click();
  await page.getByLabel("Email").fill("bob@demo.com");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText("bob@demo.com")).toBeVisible();

  await page.screenshot({ path: path.join(screenshotsDir, "04-share-dialog.png"), fullPage: true });

  await page.goto("/");
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL("/login");

  await page.getByLabel("Email").fill("bob@demo.com");
  await page.getByLabel("Password").fill("demo1234");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByRole("heading", { name: "Shared with me" })).toBeVisible();
  await page.getByText("Welcome to Collab Docs").click();
  await expect(page.getByText("View only")).toBeVisible();
  await expect(page.locator(".ProseMirror")).toHaveAttribute("contenteditable", "false");

  await page.screenshot({ path: path.join(screenshotsDir, "05-bob-viewer-readonly.png"), fullPage: true });

  const video = page.video();
  await page.close();
  await context.close();

  if (video) {
    await video.saveAs(path.join(demoDir, "collab-docs-demo.webm"));
  }
});
