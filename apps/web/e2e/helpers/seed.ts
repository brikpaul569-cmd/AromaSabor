import type { APIRequestContext } from '@playwright/test';

export interface SeedContext {
  adminEmail: string;
  adminPassword: string;
  menuId: string;
  categoryId: string;
  itemIds: string[];
  proposalId: string;
  proposalToken: string;
  publicUrl: string;
}

const API_BASE = 'http://localhost:4000/api';

/**
 * Seed test data via direct API calls using a dedicated API context.
 *
 * 1. Registers a test admin
 * 2. Creates a menu with one category and two items
 * 3. Publishes the menu
 * 4. Creates a proposal (borrador)
 * 5. Sends the proposal (enviado)
 *
 * Returns everything the E2E tests need to reference.
 */
export async function seedTestData(api: APIRequestContext): Promise<SeedContext> {
  const unique = Date.now().toString(36);
  const adminEmail = `e2e-admin-${unique}@test.com`;
  const adminPassword = 'TestPass123!';

  // 1. Register admin — cookie is stored in api context automatically
  const registerRes = await api.post(`${API_BASE}/auth/register`, {
    data: { email: adminEmail, name: 'E2E Admin', password: adminPassword },
  });
  if (!registerRes.ok()) {
    const body = await registerRes.text();
    throw new Error(`Failed to register admin: ${registerRes.status()} ${body}`);
  }

  // 2. Create menu
  const menuRes = await api.post(`${API_BASE}/menus`, {
    data: { name: 'Menú E2E Test' },
  });
  if (!menuRes.ok()) {
    const body = await menuRes.text();
    throw new Error(`Failed to create menu: ${menuRes.status()} ${body}`);
  }
  const menuData: any = await menuRes.json();
  const menuId: string = menuData._id;

  // 3. Add category
  const catRes = await api.post(`${API_BASE}/menus/${menuId}/categories`, {
    data: { id: 'entrada', label: 'Entrada', maxItems: 3 },
  });
  if (!catRes.ok()) {
    const body = await catRes.text();
    throw new Error(`Failed to add category: ${catRes.status()} ${body}`);
  }
  const catData: any = await catRes.json();
  const categories = catData.categories as any[];
  const categoryId: string = categories[categories.length - 1]!._id;

  // 4. Add items
  const itemIds: string[] = [];
  const itemsToAdd = [
    { name: 'Ensalada César', pricePerPortion: 12_000, isAvailable: true },
    { name: 'Sopa del Día', pricePerPortion: 9_000, isAvailable: true },
  ];

  for (const item of itemsToAdd) {
    const itemRes = await api.post(`${API_BASE}/menus/${menuId}/categories/${categoryId}/items`, {
      data: item,
    });
    if (!itemRes.ok()) {
      const body = await itemRes.text();
      throw new Error(`Failed to add item: ${itemRes.status()} ${body}`);
    }
    const itemData: any = await itemRes.json();
    const items = itemData.categories.find((c: any) => c._id === categoryId)?.items ?? itemData.categories[itemData.categories.length - 1]!.items;
    itemIds.push(items[items.length - 1]!._id);
  }

  // 5. Publish menu
  const pubRes = await api.patch(`${API_BASE}/menus/${menuId}/publish`, {
    data: { isActive: true },
  });
  if (!pubRes.ok()) {
    const body = await pubRes.text();
    throw new Error(`Failed to publish menu: ${pubRes.status()} ${body}`);
  }

  // 6. Create proposal
  const propRes = await api.post(`${API_BASE}/proposals`, {
    data: {
      menuId,
      clientName: 'Cliente E2E',
      eventDate: '2026-12-15',
      guestCount: 30,
      items: [
        { name: 'Ensalada César', categoryId, categoryLabel: 'Entrada', pricePerPortion: 12_000, quantity: 1 },
        { name: 'Sopa del Día', categoryId, categoryLabel: 'Entrada', pricePerPortion: 9_000, quantity: 1 },
      ],
    },
  });
  if (!propRes.ok()) {
    const body = await propRes.text();
    throw new Error(`Failed to create proposal: ${propRes.status()} ${body}`);
  }
  const propData: any = await propRes.json();
  const proposalId: string = propData._id;
  const proposalToken: string = propData.token;

  // 7. Send proposal
  const sendRes = await api.patch(`${API_BASE}/proposals/${proposalId}/send`);
  if (!sendRes.ok()) {
    const body = await sendRes.text();
    throw new Error(`Failed to send proposal: ${sendRes.status()} ${body}`);
  }

  return {
    adminEmail,
    adminPassword,
    menuId,
    categoryId,
    itemIds,
    proposalId,
    proposalToken,
    publicUrl: `http://localhost:3000/prop/${proposalToken}`,
  };
}

/**
 * Clean up test data: delete proposal and menu.
 * Must be called with the same API context used during seeding
 * (so the auth cookie is still present).
 */
export async function cleanupTestData(api: APIRequestContext, ctx: SeedContext): Promise<void> {
  const errors: string[] = [];

  if (ctx.proposalId) {
    const res = await api.delete(`${API_BASE}/proposals/${ctx.proposalId}`);
    if (!res.ok()) errors.push(`delete proposal: ${res.status()}`);
  }

  if (ctx.menuId) {
    const res = await api.delete(`${API_BASE}/menus/${ctx.menuId}`);
    if (!res.ok()) errors.push(`delete menu: ${res.status()}`);
  }

  if (errors.length > 0) {
    console.warn('Cleanup warnings:', errors.join('; '));
  }
}
