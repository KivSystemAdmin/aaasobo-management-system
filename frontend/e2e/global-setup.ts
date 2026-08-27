import { chromium, expect, type FullConfig } from "@playwright/test";
import path from "node:path";

export const ADMIN_STATE = path.join(__dirname, ".auth/admin.json");

export default async function globalSetup(config: FullConfig) {
  const fixtureZip = process.env.E2E_FIXTURE_ZIP;
  if (!fixtureZip) throw new Error("E2E_FIXTURE_ZIP is required");
  const browser = await chromium.launch();
  const context = await browser.newContext({
    baseURL: config.projects[0].use.baseURL as string,
  });
  const page = await context.newPage();
  await page.goto("/admins/login");
  await page
    .locator("#email")
    .fill(process.env.E2E_ADMIN_EMAIL ?? "e2e-admin@example.com");
  await page
    .locator("#password")
    .fill(process.env.E2E_ADMIN_PASSWORD ?? "E2e-Admin-Password!");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(/\/admins\/(?!login)/);
  await page.goto("/admins/data-import");
  await page.locator("#normalized-zip-file").setInputFiles(fixtureZip);
  await page.getByRole("button", { name: "Execute import" }).click();
  await page
    .getByRole("button", { name: /confirm|execute/i })
    .last()
    .click();
  try {
    await expect(
      page.getByRole("heading", { name: "Import Result" }),
    ).toBeVisible({ timeout: 180_000 });
  } catch (error) {
    await page.screenshot({
      path: path.resolve(process.cwd(), "test-results/global-setup-import.png"),
      fullPage: true,
    });
    const visiblePageText = (await page.locator("body").innerText()).slice(
      -4_000,
    );
    throw new Error(
      `Fixture import did not complete. Visible page text:\n${visiblePageText}\n\n${String(error)}`,
    );
  }
  await expect(
    page.getByText("Normalized import executed successfully"),
  ).toBeVisible();
  await context.storageState({ path: ADMIN_STATE });
  await browser.close();
}
