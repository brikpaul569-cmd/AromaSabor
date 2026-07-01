import { test, expect, request as apiRequest } from '@playwright/test';
import type { APIRequestContext, BrowserContext, Page } from '@playwright/test';
import { seedTestData, cleanupTestData, type SeedContext } from './helpers/seed';

/**
 * E2E: Full proposal lifecycle
 *
 * Prerequisites:
 *   - API running on http://localhost:4000 (connected to MongoDB)
 *   - `pnpm dev` in apps/web (or let playwright.config.ts start it)
 *
 * A single sequential test because each step depends on the previous:
 *   1. Register test admin & seed menu + proposal via API
 *   2. Chef logs in via UI → dashboard
 *   3. Chef opens proposal detail, sends it, copies the public URL
 *   4. Client (incognito context) opens the public URL
 *   5. Client confirms identity, toggles item status, submits response
 *   6. Chef sees the response reflected in the proposal
 */

let seed: SeedContext;

test.describe('Full Proposal Lifecycle', () => {
  let api: APIRequestContext;

  test.beforeAll(async () => {
    api = await apiRequest.newContext({ baseURL: 'http://localhost:4000' });
    seed = await seedTestData(api);
  });

  test.afterAll(async () => {
    await cleanupTestData(api, seed);
    await api.dispose();
  });

  test('full proposal lifecycle', async ({ page, browser }) => {
    // ═════════════════════════════════════════════════════════════════
    // STEP 1: Chef logs in and sends the proposal
    // ═════════════════════════════════════════════════════════════════

    // ── Login ─────────────────────────────────────────────────────────
    await page.goto('http://localhost:3000/login');
    await expect(page.getByText('Inicio Chef')).toBeVisible();

    await page.fill('#email', seed.adminEmail);
    await page.fill('#password', seed.adminPassword);
    await page.click('[data-testid="login-submit"]');

    // Should land on the chef dashboard
    await page.waitForURL('**/chef/dashboard');
    await expect(page.getByText('Cliente E2E')).toBeVisible({ timeout: 10_000 });

    // ── Navigate to the proposal detail ───────────────────────────────
    await page.click('text=Cliente E2E');
    await page.waitForURL('**/chef/proposals/**');

    // Verify proposal details are loaded
    await expect(page.getByText('Menú E2E Test')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('main').getByText('30', { exact: true })).toBeVisible(); // guest count
    await expect(page.getByText('Ensalada César')).toBeVisible();

    // Proposal was already sent by seed helper — public URL should be visible
    await expect(page.locator('[data-testid="public-url"]')).toBeVisible({ timeout: 10_000 });

    // ═════════════════════════════════════════════════════════════════
    // STEP 2: Client opens the proposal and responds
    // ═════════════════════════════════════════════════════════════════

    const clientContext: BrowserContext = await browser.newContext();
    const clientPage: Page = await clientContext.newPage();
    await clientPage.goto(seed.publicUrl);

    // ── Identity dialog ──────────────────────────────────────────────
    await expect(clientPage.getByText('¿Eres Cliente E2E?')).toBeVisible({ timeout: 10_000 });
    await clientPage.click('[data-testid="claim-confirm"]');
    await expect(clientPage.getByText('¿Eres Cliente E2E?')).not.toBeVisible({ timeout: 5_000 });

    // ── Verify proposal loads ─────────────────────────────────────────
    await expect(clientPage.getByText('Cliente E2E')).toBeVisible();
    await expect(clientPage.getByText('Menú E2E Test')).toBeVisible();
    await expect(clientPage.getByText('30', { exact: true })).toBeVisible();

    // ── Toggle item statuses ──────────────────────────────────────────
    // Accept "Ensalada César" by clicking Aceptar inside its row
    await clientPage
      .locator('[data-testid="item-toggle-ensalada-césar"]')
      .locator('button:has-text("Aceptar")')
      .click();

    // Reject "Sopa del Día"
    await clientPage
      .locator('[data-testid="item-toggle-sopa-del-día"]')
      .locator('button:has-text("Rechazar")')
      .click();

    // ── Submit response ───────────────────────────────────────────────
    await clientPage.click('[data-testid="submit-response"]');

    // Wait for the status badge to update
    await expect(clientPage.getByText('Respuesta parcial del cliente')).toBeVisible({ timeout: 15_000 });

    // Verify item-level response badges
    await expect(clientPage.getByText('Ensalada César')).toBeVisible();

    await clientContext.close();

    // ═════════════════════════════════════════════════════════════════
    // STEP 3: Chef sees the client response
    // ═════════════════════════════════════════════════════════════════

    // Navigate back to the proposal detail (chef is still logged in)
    await page.goto(`http://localhost:3000/chef/proposals/${seed.proposalId}`);
    await page.waitForURL(`http://localhost:3000/chef/proposals/${seed.proposalId}`);

    // The status should now be "respuesta_parcial"
    await expect(page.getByText('Respuesta parcial del cliente')).toBeVisible({ timeout: 10_000 });

    // Items should still be visible
    await expect(page.getByText('Ensalada César')).toBeVisible();
    await expect(page.getByText('Sopa del Día')).toBeVisible();
  });
});
